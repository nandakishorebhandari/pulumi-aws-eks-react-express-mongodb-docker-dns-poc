"use strict";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const env = pulumi.getStack();
const infra = new pulumi.StackReference(`nandakishorebhandari/infra/${env}`);
const provider = new k8s.Provider("k8s", {
  kubeconfig: infra.getOutput("kubeconfig").apply(JSON.stringify)
});

const aws_route53_zone_primary = {
  zoneId: "Z23YGHRMML4LW7"
};
const loadbalancerZoneId = "Z35SXDOTRQ7X7K";
const frontendAppName = "pulumi-web";
const backendAppName = "pulumi-api";


const frontendAppLabels = { appClass: frontendAppName };
const backendAppLabels = { appClass: backendAppName };

// Create a Fronted Deployment
const frontendDeployment = new k8s.apps.v1.Deployment(
  frontendAppName,
  {
    metadata: {
      labels: frontendAppLabels
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: frontendAppLabels },
      template: {
        metadata: {
          labels: frontendAppLabels
        },
        spec: {
          containers: [
            {
              name: frontendAppName,
              image: `nandab96/${frontendAppName}:${env}`,
              imagePullPolicy: "Always",
              ports: [{ name: "http", containerPort: 80 }]
            }
          ]
        }
      }
    }
  },
  {
    provider: provider
  }
);

// Create a Backend Deployment
const backendDeployment = new k8s.apps.v1.Deployment(
  backendAppName,
  {
    metadata: {
      labels: backendAppLabels
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: backendAppLabels },
      template: {
        metadata: {
          labels: backendAppLabels
        },
        spec: {
          containers: [
            {
              name: backendAppName,
              image: `nandab96/${backendAppName}:${env}`,
              imagePullPolicy: "Always",
              ports: [{ name: "http", containerPort: 3000 }]
            }
          ]
        }
      }
    }
  },
  {
    provider: provider
  }
);

// Export the Frontend Deployment name
export const frontendDeploymentName = frontendDeployment.metadata.apply(
  m => m.name
);
// Export the Backend Deployment name
export const backendDeploymentName = backendDeployment.metadata.apply(
  m => m.name
);

// Create a LoadBalancer Service for the Frontend Deployment
const frontendService = new k8s.core.v1.Service(
  frontendAppName,
  {
    metadata: {
      labels: frontendAppLabels
    },
    spec: {
      type: "LoadBalancer",
      ports: [{ port: 80, targetPort: "http" }],
      selector: frontendAppLabels
    }
  },
  {
    provider: provider
  }
);

// Create a LoadBalancer Service for the Backend Deployment
const backendService = new k8s.core.v1.Service(
  backendAppName,
  {
    metadata: {
      labels: backendAppLabels
    },
    spec: {
      type: "LoadBalancer",
      ports: [{ port: 80, targetPort: "http" }],
      selector: backendAppLabels
    }
  },
  {
    provider: provider
  }
);

// Export the Service name and public LoadBalancer Endpoint for Frontend
export const frontendServiceName = frontendService.metadata.apply(m => m.name);
export const frontendServiceHostname = frontendService.status.apply(
  s => s.loadBalancer.ingress[0].hostname
);

// Export the Service name and public LoadBalancer Endpoint for Backend
export const backendServiceName = backendService.metadata.apply(m => m.name);
export const backendServiceHostname = backendService.status.apply(
  s => s.loadBalancer.ingress[0].hostname
);

// Create a DNS record for Frontend Load Balancer
const appDomain = new aws.route53.Record(`app.${env}`, {
  name: `app.${env}`,
  aliases: [
    {
      evaluateTargetHealth: true,
      name: frontendServiceHostname,
      zoneId: loadbalancerZoneId
    }
  ],
  type: "A",
  zoneId: aws_route53_zone_primary.zoneId
});

// Create a DNS record for Backend Load Balancer
const apiDomain = new aws.route53.Record(`api.${env}`, {
  name: `api.${env}`,
  aliases: [
    {
      evaluateTargetHealth: true,
      name: backendServiceHostname,
      zoneId: loadbalancerZoneId
    }
  ],
  type: "A",
  zoneId: aws_route53_zone_primary.zoneId
});

// ToDo: Export the DNS Records for Frontend & Backend
// export const appDomainName = appDomain.status.apply(m => m.fqdn);
// export const apiDomainName = apiDomain.status.apply(m => m.fqdn);
