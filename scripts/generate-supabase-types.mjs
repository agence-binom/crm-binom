import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(rootDir, 'app/types/database.types.ts')

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Set it in .env before generating Supabase database types.')
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false
})

const stringifyKey = value => JSON.stringify(value)

const createEmptySection = () => [
  '{',
  '      [_ in never]: never',
  '    }'
]

const mapScalarType = (udtName, dataType, enums) => {
  if (enums.has(udtName)) {
    return `Database['public']['Enums'][${stringifyKey(udtName)}]`
  }

  switch (udtName) {
    case 'bool':
      return 'boolean'
    case 'int2':
    case 'int4':
    case 'int8':
    case 'float4':
    case 'float8':
    case 'numeric':
      return 'number'
    case 'json':
    case 'jsonb':
      return 'Json'
    case 'date':
    case 'time':
    case 'timetz':
    case 'timestamp':
    case 'timestamptz':
      return 'string'
    case 'uuid':
    case 'varchar':
    case 'bpchar':
    case 'text':
    case 'citext':
    case 'name':
    case 'bytea':
    case 'inet':
    case 'cidr':
    case 'macaddr':
    case 'macaddr8':
      return 'string'
    default:
      break
  }

  switch (dataType) {
    case 'ARRAY':
      return 'unknown[]'
    case 'boolean':
      return 'boolean'
    case 'smallint':
    case 'integer':
    case 'bigint':
    case 'real':
    case 'double precision':
    case 'numeric':
      return 'number'
    case 'json':
    case 'jsonb':
      return 'Json'
    case 'date':
    case 'time without time zone':
    case 'time with time zone':
    case 'timestamp without time zone':
    case 'timestamp with time zone':
      return 'string'
    case 'character varying':
    case 'character':
    case 'text':
    case 'uuid':
    case 'USER-DEFINED':
      return 'string'
    default:
      return 'unknown'
  }
}

const mapType = (column, enums) => {
  if (column.udt_name.startsWith('_')) {
    const elementType = mapScalarType(column.udt_name.slice(1), 'ARRAY', enums)
    return `(${elementType})[]`
  }

  return mapScalarType(column.udt_name, column.data_type, enums)
}

const formatProperty = (name, type, optional) => (
  `          ${stringifyKey(name)}${optional ? '?:' : ':'} ${type}`
)

const buildRecordLines = (columns, enums, mode) => {
  const lines = ['{']

  for (const column of columns) {
    const baseType = mapType(column, enums)
    const columnType = column.is_nullable === 'YES' ? `${baseType} | null` : baseType
    const hasDefault = column.column_default !== null
    const isGeneratedAlwaysIdentity = (
      column.is_identity === 'YES'
      && column.identity_generation === 'ALWAYS'
    )

    if (mode === 'Row') {
      lines.push(formatProperty(column.column_name, columnType, false))
      continue
    }

    if (isGeneratedAlwaysIdentity) {
      lines.push(formatProperty(column.column_name, 'never', true))
      continue
    }

    const optional = (
      mode === 'Update'
      || column.is_nullable === 'YES'
      || hasDefault
    )

    lines.push(formatProperty(column.column_name, columnType, optional))
  }

  lines.push('        }')
  return lines
}

const buildRelationshipsLines = (relationships, uniqueConstraintKeysByTable) => {
  if (relationships.length === 0) {
    return ['[]']
  }

  const groupedRelationships = []
  let currentRelationship

  for (const relationship of relationships) {
    const groupKey = `${relationship.table_name}:${relationship.constraint_name}`

    if (!currentRelationship || currentRelationship.groupKey !== groupKey) {
      currentRelationship = {
        groupKey,
        tableName: relationship.table_name,
        constraintName: relationship.constraint_name,
        referencedRelation: relationship.foreign_table_name,
        columns: [],
        referencedColumns: []
      }
      groupedRelationships.push(currentRelationship)
    }

    currentRelationship.columns.push(relationship.column_name)
    currentRelationship.referencedColumns.push(relationship.foreign_column_name)
  }

  const lines = ['[']

  for (const relationship of groupedRelationships) {
    const uniqueKey = JSON.stringify(relationship.columns)
    const isOneToOne = uniqueConstraintKeysByTable
      .get(relationship.tableName)
      ?.has(uniqueKey) ?? false

    lines.push('          {')
    lines.push(`            foreignKeyName: ${stringifyKey(relationship.constraintName)}`)
    lines.push(`            columns: ${JSON.stringify(relationship.columns)}`)
    lines.push(`            isOneToOne: ${isOneToOne}`)
    lines.push(`            referencedRelation: ${stringifyKey(relationship.referencedRelation)}`)
    lines.push(`            referencedColumns: ${JSON.stringify(relationship.referencedColumns)}`)
    lines.push('          },')
  }

  lines.push('        ]')
  return lines
}

const buildEnumsSectionLines = (enumValuesByName) => {
  if (enumValuesByName.size === 0) {
    return createEmptySection()
  }

  const lines = ['{']
  for (const [enumName, values] of enumValuesByName.entries()) {
    const union = values.map(value => stringifyKey(value)).join(' | ')
    lines.push(`      ${stringifyKey(enumName)}: ${union}`)
  }
  lines.push('    }')
  return lines
}

try {
  const [columns, foreignKeys, uniqueColumns, enums] = await Promise.all([
    sql`
      select
        table_name,
        column_name,
        udt_name,
        data_type,
        is_nullable,
        column_default,
        is_identity,
        identity_generation
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `,
    sql`
      select
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name,
        kcu.ordinal_position
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
        and tc.table_schema = kcu.table_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name
        and ccu.table_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY'
        and tc.table_schema = 'public'
      order by tc.table_name, tc.constraint_name, kcu.ordinal_position
    `,
    sql`
      select
        tc.table_name,
        array_agg(kcu.column_name order by kcu.ordinal_position) as columns
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
        and tc.table_schema = kcu.table_schema
      where tc.table_schema = 'public'
        and tc.constraint_type in ('PRIMARY KEY', 'UNIQUE')
      group by tc.table_name, tc.constraint_name
      order by tc.table_name, tc.constraint_name
    `,
    sql`
      select
        t.typname as enum_name,
        e.enumlabel as enum_value,
        e.enumsortorder
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      order by t.typname, e.enumsortorder
    `
  ])

  const enumValuesByName = new Map()
  for (const entry of enums) {
    const values = enumValuesByName.get(entry.enum_name) ?? []
    values.push(entry.enum_value)
    enumValuesByName.set(entry.enum_name, values)
  }

  const enumNames = new Set(enumValuesByName.keys())

  const columnsByTable = new Map()
  for (const column of columns) {
    const tableColumns = columnsByTable.get(column.table_name) ?? []
    tableColumns.push(column)
    columnsByTable.set(column.table_name, tableColumns)
  }

  const foreignKeysByTable = new Map()
  for (const foreignKey of foreignKeys) {
    const tableRelationships = foreignKeysByTable.get(foreignKey.table_name) ?? []
    tableRelationships.push(foreignKey)
    foreignKeysByTable.set(foreignKey.table_name, tableRelationships)
  }

  const uniqueConstraintKeysByTable = new Map()
  for (const constraint of uniqueColumns) {
    const keys = uniqueConstraintKeysByTable.get(constraint.table_name) ?? new Set()
    keys.add(JSON.stringify(constraint.columns))
    uniqueConstraintKeysByTable.set(constraint.table_name, keys)
  }

  const lines = [
    '// Generated from the live Supabase public schema by `npm run db:types`.',
    '// Do not edit this file manually.',
    '',
    'export type Json =',
    '  | string',
    '  | number',
    '  | boolean',
    '  | null',
    '  | { [key: string]: Json | undefined }',
    '  | Json[]',
    '',
    'export type Database = {',
    '  public: {',
    '    Tables: {'
  ]

  for (const tableName of [...columnsByTable.keys()].sort()) {
    const tableColumns = columnsByTable.get(tableName)
    const tableRelationships = foreignKeysByTable.get(tableName) ?? []
    const rowLines = buildRecordLines(tableColumns, enumNames, 'Row')
    const insertLines = buildRecordLines(tableColumns, enumNames, 'Insert')
    const updateLines = buildRecordLines(tableColumns, enumNames, 'Update')
    const relationshipLines = buildRelationshipsLines(tableRelationships, uniqueConstraintKeysByTable)

    lines.push(`      ${stringifyKey(tableName)}: {`)
    lines.push(`        Row: ${rowLines[0]}`)
    lines.push(...rowLines.slice(1))
    lines.push(`        Insert: ${insertLines[0]}`)
    lines.push(...insertLines.slice(1))
    lines.push(`        Update: ${updateLines[0]}`)
    lines.push(...updateLines.slice(1))
    lines.push(`        Relationships: ${relationshipLines[0]}`)
    lines.push(...relationshipLines.slice(1))
    lines.push('      }')
  }

  const viewsLines = createEmptySection()
  const functionsLines = createEmptySection()
  const enumsLines = buildEnumsSectionLines(enumValuesByName)
  const compositeTypesLines = createEmptySection()

  lines.push('    }')
  lines.push(`    Views: ${viewsLines[0]}`)
  lines.push(...viewsLines.slice(1))
  lines.push(`    Functions: ${functionsLines[0]}`)
  lines.push(...functionsLines.slice(1))
  lines.push(`    Enums: ${enumsLines[0]}`)
  lines.push(...enumsLines.slice(1))
  lines.push(`    CompositeTypes: ${compositeTypesLines[0]}`)
  lines.push(...compositeTypesLines.slice(1))
  lines.push('  }')
  lines.push('}')
  lines.push('')

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, lines.join('\n'))

  console.log(`Generated ${outputPath}`)
  console.log(`Tables: ${columnsByTable.size}`)
  console.log(`Enums: ${enumValuesByName.size}`)
} finally {
  await sql.end({ timeout: 1 })
}
