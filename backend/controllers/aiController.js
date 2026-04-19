export const enhanceReview = async (req, res) => {
  try {
    const { reviewText } = req.body;
    
    if (!reviewText || reviewText.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Review text is too short to enhance'
      });
    }
    
    let enhanced = reviewText.toLowerCase();
    let wasExpanded = false;
    
    // ========== KNOWN PHRASE EXPANSIONS ==========
    const expansions = [
      { from: /\bvery bad\b/g, to: 'This was a very disappointing experience that did not meet my expectations' },
      { from: /\bvery good\b/g, to: 'This was an excellent experience that exceeded my expectations' },
      { from: /\bvery nice\b/g, to: 'This was a wonderful experience that I truly enjoyed' },
      { from: /\broom small\b/g, to: 'The room was quite compact and smaller than expected, which made it feel a bit cramped' },
      { from: /\bsmall room\b/g, to: 'The room was quite compact and smaller than expected, which made it feel a bit cramped' },
      { from: /\broom dirty\b/g, to: 'The room was not properly cleaned, with visible dust and stains that made the stay uncomfortable' },
      { from: /\bdirty room\b/g, to: 'The room was not properly cleaned, with visible dust and stains that made the stay uncomfortable' },
      { from: /\bac not working\b/g, to: 'The air conditioning unit was not functioning properly, making the room uncomfortable during hot days' },
      { from: /\bno ac\b/g, to: 'There was no air conditioning available, which made the room very uncomfortable' },
      { from: /\blandlord rude\b/g, to: 'The landlord was unhelpful and displayed rude behavior throughout my stay' },
      { from: /\brude landlord\b/g, to: 'The landlord was unhelpful and displayed rude behavior throughout my stay' },
      { from: /\bstaff friendly\b/g, to: 'The staff was incredibly friendly and helpful throughout my stay' },
      { from: /\bfriendly staff\b/g, to: 'The staff was incredibly friendly and helpful throughout my stay' },
      { from: /\bexpensive\b/g, to: 'The price was quite high compared to the quality and amenities provided' },
      { from: /\btoo expensive\b/g, to: 'The property was significantly overpriced for what it offered' },
      { from: /\bgood location\b/g, to: 'The location was convenient and well-connected to shops, transport, and amenities' },
      { from: /\bperfect location\b/g, to: 'The location was absolutely perfect, with easy access to everything needed' },
      { from: /\bnoisy\b/g, to: 'There was significant noise disturbance, especially during night hours' },
      { from: /\btoo noisy\b/g, to: 'The area was extremely noisy, making it difficult to sleep or concentrate' },
      { from: /\bclean\b/g, to: 'The property was well-maintained and spotlessly clean throughout' },
      { from: /\bvery clean\b/g, to: 'The property was exceptionally clean and well-maintained' },
      { from: /\bwifi slow\b/g, to: 'The WiFi connection was unstable and too slow for basic tasks' },
      { from: /\bno wifi\b/g, to: 'There was no WiFi available, which was very inconvenient' },
      { from: /\bparking problem\b/g, to: 'Finding parking was difficult and problematic during the stay' },
      { from: /\bno parking\b/g, to: 'There was no designated parking available for residents' },
      { from: /\bbed uncomfortable\b/g, to: 'The bed was quite uncomfortable, leading to poor sleep quality' },
      { from: /\buncomfortable bed\b/g, to: 'The bed was quite uncomfortable, leading to poor sleep quality' },
      { from: /\bgood value\b/g, to: 'The property offered good value for money considering the amenities provided' },
      { from: /\bwould recommend\b/g, to: 'I would definitely recommend this property to other students looking for accommodation' },
      { from: /\bnot recommend\b/g, to: 'I would not recommend this property based on my experience' },
      { from: /\bworst\b/g, to: 'This was one of the worst experiences I have had with student accommodation' },
      { from: /\bamazing\b/g, to: 'This was an absolutely amazing experience that I would highly recommend' },
      { from: /\bperfect\b/g, to: 'Everything was perfect and exactly as described' }
    ];
    
    // Apply known expansions
    for (const exp of expansions) {
      if (exp.from.test(enhanced)) {
        enhanced = enhanced.replace(exp.from, exp.to);
        wasExpanded = true;
        break;
      }
    }
    
    // ========== SMART FALLBACK for unknown phrases ==========
    if (!wasExpanded) {
      // Split into words
      const words = enhanced.split(' ');
      
      // If it's a simple phrase (2-4 words), enhance it
      if (words.length >= 2 && words.length <= 6) {
        const phrase = enhanced;
        
        // Detect sentiment
        const positiveWords = ['good', 'nice', 'great', 'clean', 'friendly', 'perfect', 'amazing'];
        const negativeWords = ['bad', 'dirty', 'rude', 'noisy', 'slow', 'expensive', 'small'];
        
        let isPositive = false;
        let isNegative = false;
        
        for (const word of positiveWords) {
          if (phrase.includes(word)) {
            isPositive = true;
            break;
          }
        }
        
        for (const word of negativeWords) {
          if (phrase.includes(word)) {
            isNegative = true;
            break;
          }
        }
        
        if (isPositive) {
          enhanced = `This was a very positive experience. ${phrase.charAt(0).toUpperCase() + phrase.slice(1)} was great. I would recommend this property.`;
        } else if (isNegative) {
          enhanced = `This was a disappointing experience. ${phrase.charAt(0).toUpperCase() + phrase.slice(1)} was not satisfactory. I would not recommend this property.`;
        } else {
          enhanced = `Regarding my stay, ${phrase}. Overall, this is my honest feedback about the property.`;
        }
      }
    }
    
    // ========== GRAMMAR FIXES ==========
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    if (!enhanced.match(/[.!?]$/)) {
      enhanced += '.';
    }
    
    enhanced = enhanced.replace(/ i /g, ' I ');
    enhanced = enhanced.replace(/ dont /g, " don't ");
    enhanced = enhanced.replace(/ cant /g, " can't ");
    enhanced = enhanced.replace(/\s+/g, ' ').trim();
    
    res.json({
      success: true,
      enhancedText: enhanced
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.json({
      success: true,
      enhancedText: reviewText
    });
  }
};