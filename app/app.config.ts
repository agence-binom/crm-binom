export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },

    // Le thème Nuxt UI rend les champs en `inline-flex` (largeur du contenu), alors que dans ce repo
    // un champ occupe la largeur de son UFormField dans tous les cas sauf deux (le champ heure de
    // tasks/Modal.vue et le champ de recherche de facturation/index.vue, qui portent une largeur
    // explicite). C'est donc `w-full` le défaut réel : le poser ici évite de le réécrire sur chaque
    // champ et d'oublier de le faire sur le suivant.
    input: {
      slots: {
        root: 'w-full'
      }
    },

    textarea: {
      slots: {
        root: 'w-full'
      }
    }
  }
})
