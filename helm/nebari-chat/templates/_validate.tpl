{{- define "ravnar-nebari.validateValues" -}}
{{- if and .Values.ravnar.ingress.enabled -}}
{{- fail "ravnar.ingress is not compatible with ravnar-nebari" -}}
{{- end -}}
{{- if not .Values.nebariapp.hostname -}}
{{- fail "nebariapp.hostname must be set" -}}
{{- end -}}
{{- if not .Values.keycloak.hostname -}}
{{- fail "keycloak.hostname must be set" -}}
{{- end -}}
{{- end -}}
