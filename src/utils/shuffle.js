/**
 * Fisher-Yates 알고리즘으로 배열을 제자리(in-place) 셔플합니다.
 * @template T
 * @param {T[]} array
 * @returns {T[]} 셔플된 새 배열
 */
export function fisherYatesShuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * 비복원 추출(Sampling Without Replacement) 큐.
 * 모든 항목을 한 번씩 소모하면 자동으로 다시 셔플하여 다음 사이클을 시작합니다.
 * prev() 메서드로 이전 항목으로 돌아갈 수 있으며,
 * peekNext() 메서드로 다음 항목을 미리 볼 수 있습니다(프리페치용).
 */
export class SlideshowQueue {
    constructor(items = []) {
        this._items = items;
        this._queue = [];
        this._history = [];   // 이전으로 돌아가기용 히스토리
        this._cycle = 0;
        this._reset();
    }

    _reset() {
        this._queue = fisherYatesShuffle(this._items);
        this._cycle += 1;
        console.log(`[SlideshowQueue] Cycle ${this._cycle} started (${this._queue.length} items)`);
    }

    /**
     * 다음 항목을 반환합니다. 큐가 비어있으면 자동으로 리셔플합니다.
     * @returns {any | null} 다음 항목, 또는 항목이 없으면 null
     */
    next() {
        if (this._items.length === 0) return null;
        if (this._queue.length === 0) this._reset();
        const item = this._queue.pop();
        this._history.push(item);
        // 히스토리가 너무 커지지 않도록 제한 (최대 200개)
        if (this._history.length > 200) {
            this._history = this._history.slice(-100);
        }
        return item;
    }

    /**
     * 이전 항목을 반환합니다. 히스토리가 비어있으면 null.
     * @returns {any | null}
     */
    prev() {
        if (this._history.length <= 1) return null;
        // 현재 보고 있는 항목을 큐에 다시 넣음
        const current = this._history.pop();
        this._queue.push(current);
        // 히스토리의 마지막(이전 항목)을 반환
        return this._history[this._history.length - 1];
    }

    /**
     * 다음 항목을 미리 봅니다 (큐에서 제거하지 않음). 프리페치용.
     * @returns {any | null}
     */
    peekNext() {
        if (this._items.length === 0) return null;
        if (this._queue.length === 0) this._reset();
        return this._queue[this._queue.length - 1] || null;
    }

    /**
     * 새 항목 목록으로 큐를 교체합니다.
     * @param {any[]} items
     */
    setItems(items) {
        this._items = items;
        this._history = [];
        this._cycle = 0;
        this._reset();
    }

    get size() {
        return this._items.length;
    }
}
