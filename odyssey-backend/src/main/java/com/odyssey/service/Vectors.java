package com.odyssey.service;

/** Cosine similarity helpers for embedding vectors. */
final class Vectors {

    private Vectors() {
    }

    static double cosine(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length || a.length == 0) {
            return 0;
        }
        double dot = 0;
        double normA = 0;
        double normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
            normA += (double) a[i] * a[i];
            normB += (double) b[i] * b[i];
        }
        if (normA == 0 || normB == 0) {
            return 0;
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /** Parses the JSON float-array form used in the journal_embeddings table. */
    static float[] parseJsonArray(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        String body = json.trim();
        if (body.startsWith("[") && body.endsWith("]")) {
            body = body.substring(1, body.length() - 1);
        } else {
            return null;
        }
        if (body.isBlank()) {
            return null;
        }
        String[] parts = body.split(",");
        float[] vector = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            try {
                vector[i] = Float.parseFloat(parts[i].trim());
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return vector;
    }
}
