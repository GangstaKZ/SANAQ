export function Table(props) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  );
}
export function TableHeader(props) {
  return <thead {...props} />;
}
export function TableBody(props) {
  return <tbody {...props} />;
}
export function TableRow(props) {
  return <tr {...props} />;
}
export function TableHead(props) {
  return <th {...props} />;
}
export function TableCell(props) {
  return <td {...props} />;
}
