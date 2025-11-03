// Model configuration settings
export const MODEL_CONFIG = {
  // Model architecture
  architecture: {
    inputSize: 18, // Number of input features (updated to match actual features)
    hiddenLayers: [32, 16], // Hidden layer sizes
    outputSize: 6, // Number of strands (STEM, ABM, HUMSS, GAS, TVL, Arts)
    activation: 'relu', // Activation function for hidden layers
    outputActivation: 'softmax', // Activation function for output layer
  },
  
  // Training parameters
  training: {
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
    earlyStopping: {
      patience: 10,
      minDelta: 0.001,
    },
  },
  
  // Model paths
  paths: {
    modelDir: '/models/strand-recommender',
    modelFile: 'model.json',
    weightsFile: 'weights.bin',
  },
  
  // Feature scaling
  scaling: {
    enabled: true,
    method: 'minmax', // or 'standard'
  },
  
  // Strand mapping
  strands: {
    STEM: 0,
    ABM: 1,
    HUMSS: 2,
    GAS: 3,
    TVL: 4,
    Arts: 5,
  },
  
  // Subject mappings for feature engineering
  subjectMappings: {
    // STEM subjects
    stem: [
      'Mathematics', 
      'Science', 
      'Computer Science', 
      'Physics', 
      'Chemistry'
    ],
    
    // ABM subjects
    abm: [
      'Business Math', 
      'Economics', 
      'Accounting', 
      'Entrepreneurship'
    ],
    
    // HUMSS subjects
    humss: [
      'English', 
      'Araling Panlipunan', 
      'Literature', 
      'History', 
      'Philosophy'
    ],
  },
  
  // Interest mappings
  interestMappings: {
    stem: [
      'Science and Technology', 
      'Technical Vocational Work', 
      'Mathematics'
    ],
    abm: [
      'Business and Finance', 
      'Entrepreneurship', 
      'Leadership'
    ],
    humss: [
      'Humanities and Social Sciences', 
      'Arts and Design', 
      'Communication'
    ],
    gas: [
      'Science and Technology', 
      'Business and Finance', 
      'Humanities and Social Sciences', 
      'Communication', 
      'Arts and Design', 
      'Entrepreneurship'
    ],
    tvl: [
      'Technical Vocational Work', 
      'Science and Technology', 
      'Engineering'
    ],
    arts: [
      'Arts and Design', 
      'Communication', 
      'Humanities and Social Sciences'
    ],
  },
  
  // Hobby mappings
  hobbyMappings: {
    stem: [
      'Video Games', 
      'Coding', 
      'Reading', 
      'Photography', 
      'Building/Construction'
    ],
    abm: [
      'Reading', 
      'Writing', 
      'Board Games', 
      'Collecting', 
      'Entrepreneurial Activities'
    ],
    humss: [
      'Reading', 
      'Writing', 
      'Music', 
      'Dancing', 
      'Traveling'
    ],
    gas: [
      'Reading', 
      'Writing', 
      'Music', 
      'Sports', 
      'Traveling'
    ],
    tvl: [
      'Building/Construction', 
      'Repairing', 
      'Crafting', 
      'Technical Activities'
    ],
    arts: [
      'Drawing', 
      'Painting', 
      'Music', 
      'Dancing', 
      'Photography', 
      'Theater/Acting', 
      'Design'
    ],
  },
};