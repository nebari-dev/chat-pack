{{- define "backend.validateValues" -}}
{{- if and .Values.ravnar.ingress.enabled -}}
{{- fail "ravnar.ingress is not compatible with backend" -}}
{{- end -}}
{{- if not .Values.backend.nebariapp.hostname -}}
{{- fail "nebariapp.hostname must be set" -}}
{{- end -}}
{{- if not .Values.keycloak.hostname -}}
{{- fail "keycloak.hostname must be set" -}}
{{- end -}}
{{- end -}}
