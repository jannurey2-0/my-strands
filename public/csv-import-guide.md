# CSV Import Guide for Assessment Questions

## How to Import Questions via CSV

1. Click the "Import CSV" button in the Question Management section
2. Select a properly formatted CSV file
3. Wait for the import process to complete
4. Refresh the page to see the newly imported questions

## CSV File Format

The CSV file must include the following columns:

| Column Name | Description | Required | Example Values |
|-------------|-------------|----------|----------------|
| question | The question text | Yes | "What is 2+2?" |
| option1 | First answer option | For multiple_choice | "4" |
| option2 | Second answer option | For multiple_choice | "5" |
| option3 | Third answer option | For multiple_choice | "6" |
| option4 | Fourth answer option | For multiple_choice | "7" |
| correct_answer | Index of correct option (0-3) | Yes | 0 |
| category | Question category | Yes | "math", "science", "language", "logical" |
| difficulty_level | Difficulty level (1-3) | Yes | 1 (Easy), 2 (Medium), 3 (Hard) |
| type | Question type | Yes | "multiple_choice", "true_false" |

## Special Notes

### For True/False Questions:
- Set type to "true_false"
- Leave option columns empty
- Use 0 for "True" and 1 for "False" in correct_answer

### For Multiple Choice Questions:
- Set type to "multiple_choice"
- Fill in all option columns
- Use 0-3 for correct_answer (0=Option1, 1=Option2, etc.)

## Sample CSV Format

```csv
question,option1,option2,option3,option4,correct_answer,category,difficulty_level,type
What is 2+2?,4,5,6,7,0,math,1,multiple_choice
Water boils at 100°C.,,,,0,science,1,true_false
```

## Download Sample CSV

You can download a sample CSV file [here](/sample-questions.csv) to use as a template.