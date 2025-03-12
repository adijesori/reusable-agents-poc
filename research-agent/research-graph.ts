import { BedrockChat } from '@langchain/community/chat_models/bedrock';

import { StateGraph, Annotation, START } from '@langchain/langgraph';

import { ChatPromptTemplate } from '@langchain/core/prompts';

import { StringOutputParser } from '@langchain/core/output_parsers';

const StateAnnotation = Annotation.Root({
  topic: Annotation,
  research: Annotation,
});

function createResearchAgent() {
  const researcherPrompt = ChatPromptTemplate.fromTemplate(`
    You are a research agent that specializes in gathering information.
    
    Your task is to provide detailed information about the following topic:
    
    {topic}
    
    Provide clear, concise facts about this topic without opinion.
  `);

  const researchModel = new BedrockChat({
    model: 'anthropic.claude-v2',
    region: 'us-west-2',
    temperature: 0.3,
  });

  return researcherPrompt.pipe(researchModel).pipe(new StringOutputParser());
}

// Define workflow logic
const researchAgent = createResearchAgent();

// Create the state graph
const workflow = new StateGraph(StateAnnotation);

// Add research node
workflow
  .addNode('researchNode', async ({ topic }) => {
    const researchResult = await researchAgent.invoke({ topic });
    return { research: researchResult };
  })
  .addEdge(START, 'researchNode');

// Compile the workflow
export default workflow.compile();
