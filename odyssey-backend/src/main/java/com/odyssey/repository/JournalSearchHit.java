package com.odyssey.repository;

/**
 * Native-query projection for fulltext search: the journal id plus its
 * relevance score. The service loads full entities in a second, batched query
 * so the lazy associations keep their normal fetching strategy.
 */
public interface JournalSearchHit {

    String getId();

    double getScore();
}
