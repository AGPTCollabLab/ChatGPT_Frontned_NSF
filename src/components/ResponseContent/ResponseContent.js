import Markdown from 'react-markdown';

function SectionHeading({ node, children, ...props }) {
  const Heading = node.tagName;
  return <Heading {...props} className="font-semibold">{children}</Heading>;
}

// Shift the response's top heading level beneath the message's h3,
// preserving the relative depths of sections and subsections.
function shiftResponseHeadings() {
  return tree => {
    const headings = [];
    function collect(node) {
      if (node.type === 'heading') headings.push(node);
      node.children?.forEach(collect);
    }
    collect(tree);
    if (!headings.length) return;

    const offset = 4 - Math.min(...headings.map(heading => heading.depth));
    for (const heading of headings) {
      const level = heading.depth + offset;
      heading.depth = Math.min(level, 6);
      // HTML stops at h6; retain deeper levels for assistive technology.
      if (level > 6) {
        heading.data = { ...heading.data, hProperties: { 'aria-level': level } };
      }
    }
  };
}

const remarkPlugins = [shiftResponseHeadings];
const components = {
  h4: SectionHeading,
  h5: SectionHeading,
  h6: SectionHeading,
};

export default function ResponseContent({ content }) {
  return (
    <Markdown
      remarkPlugins={remarkPlugins}
      components={components}
      className="response-content space-y-3 text-gray-100 [&_p]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_a]:underline"
    >
      {content}
    </Markdown>
  );
}
