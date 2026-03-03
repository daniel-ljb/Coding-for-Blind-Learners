export const BLOCK_RULES = {
  "if": { "hasExpression": true, "isContinuation": false},
  "elif": { "hasExpression": true, "isContinuation": true, "validParents": ["if", "elif"]},
  "else": { "hasExpression": false, "isContinuation": true, "validParents": ["if", "elif", "try", "except", "for", "while"]},
  "def": { "hasExpression": true, "isContinuation": false },
  "class": { "hasExpression": true, "isContinuation": false},
  "for": { "hasExpression": true, "isContinuation": false },
  "while": { "hasExpression": true, "isContinuation": false},
  "with": { "hasExpression": true, "isContinuation": false},
  "try": { "hasExpression": false, "isContinuation": false },
  "except": { "hasExpression": true, "isContinuation": true, "validParents": ["try", "except"]},
  "finally": { "hasExpression": false, "isContinuation": true, "validParents": ["try", "except", "else"] },
  "match": { "hasExpression": true, "isContinuation": false},
  "case": { "hasExpression": true, "isContinuation": true, "validParents": ["match", "case"] }
};

export const BLOCK_HINT = {
  "if": "Enter if condition",
  "elif": "Enter elif condition",
  "def": "Enter function signature",
  "class": "Enter class",
  "for": "Enter for loop expression",
  "while": "Enter while loop condition",
  "with": "Enter with statement expression",
  "except": "Enter exception type",
  "match": "Enter match expression",
  "case": "Enter case pattern"
}