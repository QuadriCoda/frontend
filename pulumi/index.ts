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
const scrapperAdminFrontendIngress = new k8s.networking.v1.Ingress("scrapper-admin-frontend-ingress", {
  metadata: {
      name: "scrapper-admin-frontend-ingress",
      annotations: {
          "kubernetes.io/ingress.class": "nginx",
          // Add any other necessary annotations
      },
  },
  spec: {
      rules: [
          {
              host: "scrapper-admin-frontend.local", // Change this to your desired hostname
              http: {
                  paths: [
                      {
                          path: "/",
                          pathType: "Prefix",
                          backend: {
                              service: {
                                  name: scrapperAdminFrontendServiceName,
                                  port: {
                                      number: 30000, // Update this to the correct port of your service
                                  },
                              },
                          },
                      },
                  ],
              },
          },
      ],
      // Uncomment and configure this section if you need TLS/HTTPS
      // tls: [{
      //     hosts: ["scrapper-admin-frontend.local"],
      //     secretName: "scrapper-admin-frontend-tls", // You'll need to create a TLS secret for this
      // }],
  },
}, { provider: k8sProvider });

// Export the Ingress hostname
export const scrapperAdminFrontendIngressHostname = scrapperAdminFrontendIngress.metadata.name;
