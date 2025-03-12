import { BedrockChat } from '@langchain/community/chat_models/bedrock';

import { ChatPromptTemplate } from '@langchain/core/prompts';

import { StringOutputParser } from '@langchain/core/output_parsers';

function createCreativeAgent() {
  const creativePrompt = ChatPromptTemplate.fromTemplate(`
    You are a creative assistant that specializes in unique perspectives.
    
    Your task is to take the following research and transform it into something creative:
    
    RESEARCH: {research}
    
    Create a short story, analogy, or metaphor that makes this information more engaging.
  `);

  const creativeModel = new BedrockChat({
    model: 'anthropic.claude-instant-v1',
    region: 'us-west-2',
    temperature: 0.7,
  });

  return creativePrompt.pipe(creativeModel).pipe(new StringOutputParser());
}

const creativeAgent = createCreativeAgent();

export default {
  async invoke({ research }) {
    const creativeResult = await creativeAgent.invoke({ research });
    return { result: creativeResult };
  }
};
