{{/*
NebariApp helper template.
Expects a dict with keys: top, component, service, nebariapp
*/}}
{{- define "nebari-chat.nebariapp" -}}
{{- $top := .top -}}
{{- $component := .component -}}
{{- $service := .service -}}
{{- $nebariapp := .nebariapp -}}
apiVersion: reconcilers.nebari.dev/v1
kind: NebariApp
metadata:
  name: {{ include "ravnar.component-name" (dict "top" $top "component" $component) }}
  namespace: {{ $top.Release.Namespace }}
  labels:
    {{- include "ravnar.labels" (dict "top" $top "component" $component) | nindent 4 }}
spec:
  hostname: {{ required (printf "%s.nebariapp.hostname is required" $component) $nebariapp.hostname }}
  service:
    name: {{ $service.name }}
    port: {{ $service.port }}
  {{- with $nebariapp.routing }}
  routing:
    {{- toYaml . | nindent 4 }}
  {{- end }}
  {{- with $nebariapp.auth }}
  auth:
    enabled: {{ .enabled }}
    provider: {{ .provider }}
    provisionClient: {{ .provisionClient }}
    enforceAtGateway: {{ .enforceAtGateway }}
    redirectURI: {{ .redirectURI }}
    {{- with .scopes }}
    scopes:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .groups }}
    groups:
      {{- toYaml . | nindent 6 }}
    {{- end }}
    {{- with .spaClient }}
    spaClient:
      {{- toYaml . | nindent 6 }}
    {{- end }}
  {{- end }}
  {{- with $nebariapp.gateway }}
  gateway: {{ . }}
  {{- end }}
{{- end -}}

{{/*
Construct a JSON representation of the ravnar subchart context.
Useful for evaluating ravnar templates that depend on subchart scope.
*/}}
{{- define "nebari-chat.ravnarContextJson" -}}
{{- dict
    "Chart" (dict "Name" "ravnar" "Version" .Chart.Version)
    "Release" .Release
    "Values" .Values.ravnar
    "Capabilities" .Capabilities
    "Template" .Template
    | toJson -}}
{{- end -}}
