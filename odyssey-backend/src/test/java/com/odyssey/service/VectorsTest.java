package com.odyssey.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VectorsTest {

    @Test
    void cosineOfIdenticalVectorsIsOne() {
        assertThat(Vectors.cosine(new float[]{1, 2, 3}, new float[]{1, 2, 3})).isCloseTo(1.0, org.assertj.core.data.Offset.offset(1e-9));
    }

    @Test
    void cosineOfOrthogonalVectorsIsZero() {
        assertThat(Vectors.cosine(new float[]{1, 0}, new float[]{0, 1})).isZero();
    }

    @Test
    void cosineOfOppositeVectorsIsMinusOne() {
        assertThat(Vectors.cosine(new float[]{1, 0}, new float[]{-1, 0}))
                .isCloseTo(-1.0, org.assertj.core.data.Offset.offset(1e-9));
    }

    @Test
    void mismatchedOrEmptyVectorsScoreZeroRatherThanThrowing() {
        assertThat(Vectors.cosine(null, new float[]{1})).isZero();
        assertThat(Vectors.cosine(new float[]{1}, null)).isZero();
        assertThat(Vectors.cosine(new float[]{1, 2}, new float[]{1, 2, 3})).isZero();
        assertThat(Vectors.cosine(new float[]{}, new float[]{})).isZero();
        assertThat(Vectors.cosine(new float[]{0, 0}, new float[]{1, 2})).isZero();
    }

    @Test
    void parsesJsonFloatArrays() {
        assertThat(Vectors.parseJsonArray("[0.5,-1.25,3]")).containsExactly(0.5f, -1.25f, 3f);
        assertThat(Vectors.parseJsonArray(" [ 1 , 2 ] ")).containsExactly(1f, 2f);
    }

    @Test
    void rejectsMalformedJsonGracefully() {
        assertThat(Vectors.parseJsonArray(null)).isNull();
        assertThat(Vectors.parseJsonArray("")).isNull();
        assertThat(Vectors.parseJsonArray("not json")).isNull();
        assertThat(Vectors.parseJsonArray("[]")).isNull();
        assertThat(Vectors.parseJsonArray("[1,2,oops]")).isNull();
    }
}
