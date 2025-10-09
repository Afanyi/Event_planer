type Props = {
    q: string;
    setQ: (v: string) => void;
    from: string;
    setFrom: (v: string) => void;
    to: string;
    setTo: (v: string) => void;
    onApply: () => void;
};

export default function Filters({ q, setQ, from, setFrom, to, setTo, onApply }: Props) {
    return (
        <div className="card row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
                <input
                    placeholder="Search title…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                />
                <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                />
            </div>
            <button onClick={onApply}>Apply</button>
        </div>
    );
}
