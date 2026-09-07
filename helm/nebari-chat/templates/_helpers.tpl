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
