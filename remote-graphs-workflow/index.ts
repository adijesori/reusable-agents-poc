import 'dotenv/config';
import fs from 'fs';
import { RemoteGraph } from 'remote-graphs-utils';
import express from 'express';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';

const researchAgent = new RemoteGraph({
  graphName: 'researchAgent',
  url: 'http://localhost:3001',
});

const creativeAgent = new RemoteGraph({
  graphName: 'creativeAgent',
  url: 'http://localhost:3002',
});

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

const StateAnnotation = Annotation.Root({
  topic: Annotation,
  research: Annotation,
  myResult: Annotation,
});

const graph = new StateGraph(StateAnnotation)
  .addNode('researchAgent', researchAgent.invoke)
  .addNode('creativeAgent', async params => {
    const { result } = await creativeAgent.invoke({ research: params.research });

    return {
      myResult: result,
    };
  })
  .addEdge(START, 'researchAgent')
  .addEdge('researchAgent', 'creativeAgent')
  .addEdge('creativeAgent', END)
  .compile();

async function writeBlobToFile(blob, filePath: string) {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);
}

app.get('/graph', async (req, res) => {
  try {
    const drawableGraph = await graph.getGraphAsync();
    const png = await drawableGraph.drawMermaidPng();

    await writeBlobToFile(png, 'graph.png');
    res.sendFile(`${process.cwd()}/graph.png`);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.post('/invoke', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Please provide a topic' });
    }

    console.log(`Processing request for topic: ${topic}`);

    const result = await graph.invoke({ topic });

    res.json({
      topic: topic,
      research: result.research,
      creative_output: result.myResult,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
