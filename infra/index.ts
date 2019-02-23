import * as awsinfra from "@pulumi/aws-infra";
import * as eks from "@pulumi/eks";

const name = "unify-dev";
// Create an EKS cluster with non-default configuration
const vpc = new awsinfra.Network("vpc", { usePrivateSubnets: false });
const cluster = new eks.Cluster(name, {
    vpcId: vpc.vpcId,
    subnetIds: vpc.subnetIds,
    desiredCapacity: 1,
    minSize: 1,
    maxSize: 2,
    storageClasses: "gp2",
    deployDashboard: true,
});

// Export the clusters' kubeconfig.
exports.kubeconfig = cluster.kubeconfig;
