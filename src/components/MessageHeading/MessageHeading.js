export default function MessageHeading({ id, role }) {
  return (
    <h3 id={id} className="mb-2 font-semibold text-gray-100">
      {role === 'assistant' ? 'AGPT responded' : 'You said'}
    </h3>
  );
}
