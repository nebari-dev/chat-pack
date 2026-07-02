{{/*
NebariApp helper template.
Expects a dict with keys: top, component, service, nebariapp
*/}}
{{- define "nebari-chat.nebariApp" -}}
{{- $top := .top -}}
{{- $component := .component -}}
{{- include "nebari-app.nebariApp" (dict
    "metadata" (dict
      "name"      (include "ravnar.component-name" (dict "top" $top "component" $component))
      "namespace" $top.Release.Namespace
      "labels"    (include "ravnar.labels" (dict "top" $top "component" $component) | fromYaml)
    )
    "spec" .spec
) -}}
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
