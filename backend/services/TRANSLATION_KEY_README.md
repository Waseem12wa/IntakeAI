# Translation Key Loader Module

This module provides functionality to load and query the translation key (pricing database) for n8n workflow nodes.

## Features

- Loads translation key JSON file into memory
- Looks up pricing information by node type
- Applies modifiers to calculate additional costs
- Computes final prices with min/max rules enforcement

## Usage

### Loading the translation key
```javascript
const { loadTranslationKey } = require('./translationKey');

const key = loadTranslationKey();
```

### Looking up node type pricing
```javascript
const { lookupByNodeType } = require('./translationKey');

const item = lookupByNodeType('httpRequest');
```

### Applying modifiers
```javascript
const { applyModifier } = require('./translationKey');

const modifierResult = applyModifier(item, 'concurrency', 3);
// Returns: { cost: 6.00, description: 'concurrency: 3 × $2.00' }
```

### Computing final price
```javascript
const { computePrice } = require('./translationKey');

const item = lookupByNodeType('httpRequest');
const price = computePrice(item, { 'attachment_mb': 5, 'concurrency': 3 });
// Returns: { final_price: 17.25, breakdown: [...] }
```

## API

### loadTranslationKey()
Loads the translation key JSON file into memory.

**Returns:** `Object` - The loaded translation key

### lookupByNodeType(nodeType)
Looks up pricing information by node type.

**Parameters:**
- `nodeType` (string): The node type to look up

**Returns:** `Object|null` - Pricing object for the node type or null if not found

### applyModifier(item, modifierName, value)
Applies a modifier to calculate additional cost.

**Parameters:**
- `item` (Object): The pricing item from lookupByNodeType
- `modifierName` (string): The name of the modifier to apply
- `value` (number|boolean): The value to apply for the modifier

**Returns:** `Object` - Modifier calculation result with cost and description

### computePrice(item, modifiersDict)
Computes the final price for an item with given modifiers.

**Parameters:**
- `item` (Object): The pricing item from lookupByNodeType
- `modifiersDict` (Object): Dictionary of modifiers to apply

**Returns:** `Object` - Price calculation result with final price and breakdown

## Example

```javascript
const { lookupByNodeType, computePrice } = require('./translationKey');

// Look up pricing for an HTTP Request node
const item = lookupByNodeType('httpRequest');

// Calculate price with modifiers
const price = computePrice(item, {
  'attachment_mb': 5,
  'concurrency': 3
});

console.log(price);
// Output:
// {
//   final_price: 17.25,
//   breakdown: [
//     { description: 'HTTP Request (base)', amount: 10 },
//     { description: 'concurrency: 3 × $2.00', amount: 6 },
//     { description: 'attachment_mb: 5 MB × $0.25/MB', amount: 1.25 }
//   ]
// }
```

## Modifier Types

The module supports these modifier types:

1. **per_unit** - Price per unit of the modifier
2. **per_mb** - Price per megabyte
3. **per_kb** - Price per kilobyte
4. **boolean** - Fixed price if the modifier is true
5. **multiplier** - Multiplier applied to a base value

## Error Handling

- Returns `null` for invalid node types in `lookupByNodeType`
- Returns zero cost for non-existent modifiers in `applyModifier`
- Handles invalid items gracefully in `computePrice`