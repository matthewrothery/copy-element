import './BlogGenerator.css';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/Input/Input';
import { Button } from '@/components/Button/Button';

export function BlogGenerator(): React.ReactElement {
  const [topic, setTopic] = useState('');
  const [author, setAuthor] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [filePath, setFilePath] = useState<string | undefined>();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setOutput(null);
    setSuccess(null);

    api.generateBlog(topic.trim(), author.trim() || undefined, dryRun)
      .then((result) => {
        setOutput(result.output);
        setSuccess(result.success);
        setFilePath(result.filePath);
      })
      .catch((err: unknown) => {
        setOutput(String(err));
        setSuccess(false);
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="blog-gen">
      <p className="blog-gen__description">
        Generate a blog post using AI. The post will be written to{' '}
        <code>website/content/</code> on the server.
      </p>

      <div className="blog-gen__card">
        <form className="blog-gen__form" onSubmit={handleSubmit}>
          <Input
            label="Topic"
            id="blog-topic"
            placeholder="e.g. How to use CSS Variables for design systems"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Input
            label="Author (optional)"
            id="blog-author"
            placeholder="e.g. Matt"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <label className="blog-gen__dry-run">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            Dry run (preview without writing file)
          </label>
          <Button type="submit" loading={loading} disabled={!topic.trim()}>
            Generate Post
          </Button>
        </form>
      </div>

      {output !== null && (
        <div className={`blog-gen__result ${success ? 'blog-gen__result--success' : 'blog-gen__result--failure'}`}>
          <div className="blog-gen__result-header">
            <span className={`blog-gen__status ${success ? 'blog-gen__status--ok' : 'blog-gen__status--fail'}`}>
              {success ? '✓ Generated' : '✗ Failed'}
            </span>
            {filePath && <code className="blog-gen__filepath">{filePath}</code>}
          </div>
          <pre className="blog-gen__output">{output}</pre>
        </div>
      )}
    </div>
  );
}
