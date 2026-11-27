export const featureFaq = [
  {
    question: "What does Hardvoxel do?",
    answer:
      "It reads a hardvoxel.json file, pulls the images you specify, and runs them with ports, environment variables, and volumes on your Docker host.",
  },
  {
    question: "Does it build container images?",
    answer:
      "No. Build and push the image with your own pipeline, then point Hardvoxel at the exact tag.",
  },
  {
    question: "Is it a Docker Compose replacement?",
    answer:
      "No. The config is a small subset for prebuilt images. It does not implement Compose files, builds, networks, dependencies, or health checks.",
  },
  {
    question: "Does it handle domains and TLS?",
    answer:
      "No. Put Caddy, Traefik, or nginx in front of the published ports if you need domains and certificates.",
  },
  {
    question: "Is it production-ready?",
    answer:
      "It is alpha. The schema may change, and the CLI does not yet cover health checks, start order, or networking.",
  },
];

export const featureFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: featureFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};
