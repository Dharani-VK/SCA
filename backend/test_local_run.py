from app.vector_store import ChromaVectorStore
from app.ingest import chunk_text, embed_texts
from app.utils import generate_answer_with_context, generate_summary, generate_adaptive_quiz_question


def run_quick_local_test():
    store = ChromaVectorStore(persist_directory="chroma_store_test", collection_name="test_docs")
    # clear any existing docs
    try:
        store.clear()
    except Exception:
        pass

    docs = [
        "Sorting algorithms arrange items in a certain order. Common sorting algorithms include quicksort, mergesort, and bubble sort.",
        "Search algorithms like binary search require sorted input. Binary search runs in O(log n) time.",
        "Machine learning introduces models that learn from data. Supervised learning uses labeled examples."
    ]

    embs = embed_texts(docs)
    payload = []
    for i, (d, e) in enumerate(zip(docs, embs)):
        payload.append({"id": f"doc_{i}", "text": d, "embedding": e, "meta": {"source": "test"}})
    store.add_documents(payload)

    question = "What is binary search and when does it work?"
    q_emb = embed_texts([question])[0]
    hits = store.similarity_search(q_emb, top_k=3)
    print("Similarity hits:")
    for h in hits:
        print(h['id'], h.get('score'))

    contexts = [h['text'] for h in hits]
    ans = generate_answer_with_context(question, contexts)
    print('\nAnswer:')
    print(ans)

    print('\nSummary:')
    print(generate_summary(contexts))

    print('\nQuiz question:')
    print(generate_adaptive_quiz_question("Algorithms", contexts, difficulty="medium"))


if __name__ == '__main__':
    run_quick_local_test()
