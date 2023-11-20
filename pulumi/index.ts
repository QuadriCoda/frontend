import * as pulumi from "@pulumi/pulumi";
import * as k8s from '@pulumi/kubernetes';

// Use an environment variable to get the kubeconfig
const kubeconfig = process.env.KUBECONFIG || "";
const githubSha = process.env.GITHUB_SHA || "latest";

const k8sProvider = new k8s.Provider('k8s-provider', {
  kubeconfig: kubeconfig,
});

const stack = pulumi.getStack();

// Helm chart for scrapper-admin-frontend
const scrapperAdminFrontendName = 'scrapper-admin-frontend';
const scrapperAdminFrontendChart = new k8s.helm.v3.Chart(scrapperAdminFrontendName, {
  path: `../helm-charts`,
  values: {
    image: {
      tag: githubSha,
    },
  },
}, { provider: k8sProvider });

// Kustomize configuration for scrapper-admin-frontend
const kustomizeConfigScrapperAdminFrontend = new k8s.yaml.ConfigGroup('kustomize-scrapper-admin-frontend', {
  files: [`../kustomize/overlays/${stack}/kustomization.yaml`],
}, { provider: k8sProvider });

// Export service name for scrapper-admin-frontend
export const scrapperAdminFrontendServiceName = scrapperAdminFrontendChart.getResource('v1/Service', scrapperAdminFrontendName).metadata.name;
