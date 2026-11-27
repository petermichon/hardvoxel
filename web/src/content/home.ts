export type HomeFaq = {
  question: string;
  answer: string;
};

export const homeFaq: HomeFaq[] = [
  {
    question: "What is Hardvoxel?",
    answer:
      "Hardvoxel is an open-source CLI for deploying prebuilt OCI images to your own Docker host. A small JSON file describes the image, ports, environment, and volumes.",
  },
  {
    question: "Is this a hosting service?",
    answer:
      "No. There is no managed cloud, account, or paid plan on this site. You run the CLI on a Docker host you control.",
  },
  {
    question: "Does it build images?",
    answer:
      "No. Build and push the image with your existing tooling, then point Hardvoxel at the exact tag.",
  },
  {
    question: "Which registries can I use?",
    answer:
      "Docker Hub, GHCR, or any OCI-compliant registry. If Docker can pull the image, Hardvoxel can run it.",
  },
  {
    question: "Do I need Kubernetes?",
    answer:
      "No. Hardvoxel talks to a local Docker Engine. There is no cluster, control plane, or YAML to operate.",
  },
  {
    question: "What licence is it under?",
    answer:
      "The project is open source. See the repository for the licence and the current source.",
  },
];

export const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};
