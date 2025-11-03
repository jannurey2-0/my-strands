// Script to run ML training with real data
import { MLExample } from './mlExample';

async function runMLTraining() {
  console.log('Starting ML training process...');
  
  const example = new MLExample();
  await example.runCompleteWorkflow();
  
  console.log('ML training process completed.');
}

// Run the training directly
runMLTraining().catch(console.error);