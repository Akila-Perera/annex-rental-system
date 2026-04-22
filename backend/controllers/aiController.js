export const enhanceReview = async (req, res) => {
  try {
    const { reviewText } = req.body;
    
    if (!reviewText || reviewText.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Review text is too short to enhance'
      });
    }
    
    let originalText = reviewText.toLowerCase();
    let expandedText = originalText;
    
    // ========== PHRASE EXPANSIONS ==========
    const expansions = [
      { from: /\bvery bad\b/g, to: 'very poor' },
      { from: /\bvery good\b/g, to: 'excellent' },
      { from: /\broom small\b/g, to: 'the room was smaller than expected' },
      { from: /\bsmall room\b/g, to: 'the room was smaller than expected' },
      { from: /\broom dirty\b/g, to: 'the room was not properly cleaned' },
      { from: /\bdirty room\b/g, to: 'the room was not properly cleaned' },
      { from: /\bac not working\b/g, to: 'the air conditioning was not functioning' },
      { from: /\bno ac\b/g, to: 'there was no air conditioning' },
      { from: /\blandlord rude\b/g, to: 'the landlord was unhelpful' },
      { from: /\brude landlord\b/g, to: 'the landlord was unhelpful' },
      { from: /\ba bad annex\b/g, to: 'the annex was disappointing' },
      { from: /\bbad annex\b/g, to: 'the annex was disappointing' },
      { from: /\ba good annex\b/g, to: 'the annex was very good' },
      { from: /\bgood annex\b/g, to: 'the annex was very good' },
      { from: /\bworst\b/g, to: 'very poor' },
    ];
    
    // Apply expansions
    for (const exp of expansions) {
      if (exp.from.test(expandedText)) {
        expandedText = expandedText.replace(exp.from, exp.to);
        break;
      }
    }
    
    // If no expansion matched, use original text
    if (expandedText === originalText) {
      expandedText = originalText;
    }
    
    // ========== BUILD CLEAN SENTENCE ==========
    let finalText = '';
    
    // Detect sentiment
    const negativeWords = ['bad', 'poor', 'dirty', 'noisy', 'small', 'rude', 'unhelpful', 'disappointing', 'worst', 'terrible', 'awful'];
    const positiveWords = ['good', 'great', 'excellent', 'clean', 'spacious', 'friendly', 'helpful', 'perfect', 'amazing'];
    
    const hasNegative = negativeWords.some(word => expandedText.includes(word));
    const hasPositive = positiveWords.some(word => expandedText.includes(word));
    
    // Clean the text - remove any "a" before "the"
    let cleanText = expandedText;
    cleanText = cleanText.replace(/\ba\s+the\b/gi, 'the');
    cleanText = cleanText.replace(/\bthe\s+the\b/gi, 'the');
    
    // Capitalize first letter
    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    
    if (hasNegative && !hasPositive) {
      finalText = `I had a disappointing experience. ${cleanText}. I would not recommend this property.`;
    } else if (hasPositive && !hasNegative) {
      finalText = `I had a great experience. ${cleanText}. I would definitely recommend this property.`;
    } else {
      finalText = cleanText + '.';
    }
    
    // Final cleanup
    finalText = finalText.replace(/\.\s+\./g, '.');
    finalText = finalText.replace(/\s+/g, ' ').trim();
    finalText = finalText.replace(/\bthe the\b/gi, 'the');
    finalText = finalText.replace(/\bA the\b/gi, 'The');
    finalText = finalText.replace(/\bthe\s+the\b/gi, 'the');
    
    // Add period at the end if missing
    if (!finalText.match(/[.!?]$/)) {
      finalText += '.';
    }
    
    res.json({
      success: true,
      enhancedText: finalText
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.json({
      success: true,
      enhancedText: reviewText
    });
  }
};