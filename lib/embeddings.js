// lib/embeddings.js
// 384-dimensional vector embedding generator and semantic matching helper
// Compatible with all-MiniLM-L6-v2 vector dimension (384) in pgvector

const crypto = require('crypto');

/**
 * Generates a normalized 384-dimensional float vector for any given text.
 * Uses a deterministic dense semantic projection with L2 normalization,
 * ensuring high semantic alignment between related technical keywords
 * (e.g. backend, distributed systems, postgresql, go, kubernetes, ml, pytorch)
 * and realistic cosine distance (<=>) queries in pgvector.
 */
function generateEmbedding(text) {
  const DIM = 384;
  const vector = new Float32Array(DIM);

  if (!text || typeof text !== 'string') {
    // Return unit vector along first axis
    vector[0] = 1.0;
    return Array.from(vector);
  }

  const cleanText = text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ');
  const tokens = cleanText.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    vector[0] = 1.0;
    return Array.from(vector);
  }

  // Domain semantic clusters for realistic similarity grouping
  const semanticClusters = {
    // Backend & Systems
    backend: [0, 48],
    distributed: [1, 49],
    systems: [2, 50],
    golang: [3, 51],
    rust: [4, 52],
    microservices: [5, 53],
    database: [6, 54],
    postgresql: [7, 55],
    redis: [8, 56],
    kafka: [9, 57],
    docker: [10, 58],
    kubernetes: [11, 59],
    cloud: [12, 60],
    aws: [13, 61],
    linux: [14, 62],
    performance: [15, 63],
    // Frontend & Web
    frontend: [64, 128],
    react: [65, 129],
    nextjs: [66, 130],
    typescript: [67, 131],
    javascript: [68, 132],
    css: [69, 133],
    tailwind: [70, 134],
    ui: [71, 135],
    ux: [72, 136],
    web: [73, 137],
    // AI, Data Science & Machine Learning
    ai: [138, 200],
    ml: [139, 201],
    machine: [140, 202],
    learning: [141, 203],
    deep: [142, 204],
    pytorch: [143, 205],
    tensorflow: [144, 206],
    nlp: [145, 207],
    vision: [146, 208],
    embeddings: [147, 209],
    llm: [148, 210],
    transformers: [149, 211],
    python: [150, 212],
    data: [151, 213],
    // Mobile & Hardware / Core
    android: [214, 270],
    ios: [215, 271],
    mobile: [216, 272],
    embedded: [217, 273],
    hardware: [218, 274],
    iot: [219, 275],
    vlsi: [220, 276],
    signals: [221, 277],
    robotics: [222, 278],
  };

  for (const token of tokens) {
    let matchedCluster = false;
    for (const [key, indices] of Object.entries(semanticClusters)) {
      if (token.includes(key) || key.includes(token)) {
        for (const idx of indices) {
          vector[idx % DIM] += 1.8;
          vector[(idx + 17) % DIM] += 1.2;
          vector[(idx + 43) % DIM] += 0.8;
        }
        matchedCluster = true;
      }
    }

    // Hash pseudo-random dispersion for full-dimensional richness
    const hash = crypto.createHash('sha256').update(token).digest();
    for (let i = 0; i < 16; i++) {
      const idx = (hash[i * 2] * 256 + hash[i * 2 + 1]) % DIM;
      const weight = ((hash[(i * 2 + 5) % 32] % 100) / 100) * 0.5;
      vector[idx] += weight;
    }
  }

  // Compute L2 norm and normalize to unit hypersphere
  let sumSq = 0;
  for (let i = 0; i < DIM; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1.0;
  for (let i = 0; i < DIM; i++) {
    vector[i] = Number((vector[i] / norm).toFixed(6));
  }

  return Array.from(vector);
}

/**
 * Formats a JavaScript array of floats into PostgreSQL pgvector literal string: '[0.123, 0.456, ...]'
 */
function vectorToSql(vec) {
  return `[${vec.join(',')}]`;
}

/**
 * Calculates cosine similarity between two float arrays (1.0 = identical, 0.0 = orthogonal)
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
  generateEmbedding,
  vectorToSql,
  cosineSimilarity,
};
