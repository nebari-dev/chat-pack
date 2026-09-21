{
  "keycloak": {
    "url": "{{ .KEYCLOAK_URL }}",
    "realm": "{{ .KEYCLOAK_REALM }}",
    "clientId": "{{ .KEYCLOAK_CLIENT_ID }}"
  },
  "branding": {
    "title": "{{ .BRANDING_TITLE }}",
    "logoUrl": "{{ .BRANDING_LOGO_URL }}",
    "logoUrlDark": "{{ .BRANDING_LOGO_URL_DARK }}",
    "faviconUrl": "{{ .BRANDING_FAVICON_URL }}",
    "theme": {
      "light": {{ if .BRANDING_THEME_LIGHT }}{{ .BRANDING_THEME_LIGHT }}{{ else }}{}{{ end }},
      "dark": {{ if .BRANDING_THEME_DARK }}{{ .BRANDING_THEME_DARK }}{{ else }}{}{{ end }}
    }
  }
}
