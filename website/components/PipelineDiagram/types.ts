export interface PipelineNode {
  id: string;
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  microcopy?: string;
  tags?: string[];
  highlight?: boolean;
}

export interface PipelineDiagramProps {
  nodes: PipelineNode[];
  className?: string;
}
