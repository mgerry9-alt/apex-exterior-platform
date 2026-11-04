require 'json'

module ExteriorOutreach
  class ResearchEngine
    INTENT_CATEGORIES = {
      'BOOKING_READY' => {
        name: 'Ready to Book / Schedule',
        color: '#10b981',
        description: 'Customer is eager or asking to lock in a date/time.'
      },
      'PRICE_OBJECTION' => {
        name: 'Price / Budget Friction',
        color: '#f59e0b',
        description: 'Customer feels the quote is too high or asks for discounts.'
      },
      'SAFETY_CONCERN' => {
        name: 'Plant / Property Safety Worry',
        color: '#8b5cf6',
        description: 'Concerned about harsh bleach, high pressure stripping siding, or damaging plants/pets.'
      },
      'TIMING_DELAY' => {
        name: 'Timing Delay / Seasonality',
        color: '#3b82f6',
        description: 'Asking to reach back out in spring, next month, or after weather passes.'
      },
      'SPOUSAL_CHECK' => {
        name: 'Spousal / HOA Consultation',
        color: '#6366f1',
        description: 'Needs to consult wife/husband, HOA board, or landlord.'
      },
      'SCOPE_INQUIRY' => {
        name: 'Scope / Service Clarification',
        color: '#06b6d4',
        description: 'Inquiring if additional areas (deck, driveway, gutters) are covered.'
      },
      'COMPETITOR_COMPARISON' => {
        name: 'Competitor / Flyer Comparison',
        color: '#ec4899',
        description: 'Comparing against a cheaper competitor or neighbor flyer.'
      },
      'OPT_OUT' => {
        name: 'Opt-Out / Unsubscribe',
        color: '#ef4444',
        description: 'Customer replied STOP, unsubscribe, or remove.'
      },
      'WINDOW_QUOTE_INQUIRY' => {
        name: 'Window Pricing / Quote Request',
        color: '#0284c7',
        description: 'Asking for window pricing, pane counts, or estimate calculations.'
      },
      'SUBSCRIPTION_INQUIRY' => {
        name: 'Subscription / Membership Plan',
        color: '#8b5cf6',
        description: 'Inquiring about recurring maintenance, monthly plans, or seasonal care.'
      },
      'REFUND_REQUEST_ESCALATION' => {
        name: 'Refund Request (Human Escalation Required)',
        color: '#dc2626',
        description: 'Demanding refund or payment reversal; strictly requires supervisor authorization.'
      },
      'UNAUTHORIZED_DISCOUNT_REQUEST' => {
        name: 'Discount Request (Human Review)',
        color: '#ea580c',
        description: 'Discount requests require human review because no terms are approved in this prototype.'
      },
      'SECURITY_BOUNDARY_VIOLATION' => {
        name: 'Security Boundary / Hardware Actuation Defense',
        color: '#b91c1c',
        description: 'Attempted prompt injection, system tampering, or remote physical valve actuation.'
      },
      'GENERAL_INQUIRY' => {
        name: 'General Question',
        color: '#6b7280',
        description: 'Routine questions about licensing, insurance, or payment terms.'
      }
    }.freeze

    # Comprehensive analysis of inbound customer text
    def self.analyze_response(text, contact = nil)
      down = text.downcase.strip

      # 1. Detect Opt-out
      if down.match?(/\b(stop|unsubscribe|cancel|quit|end|remove me|opt out|do not text|wrong number)\b/)
        return {
          sentiment: 'Negative',
          sentiment_score: -0.9,
          intent_category: 'OPT_OUT',
          objection_detail: 'Contact requested removal / STOP keyword triggered',
          key_phrases: ['stop', 'unsubscribe'],
          recommended_reply: 'You have been unsubscribed from Apex Exterior updates. Reply START to re-subscribe anytime.',
          conversion_outcome: 'Unsubscribed'
        }
      end

      # 2. Check strict AI Policy Guardrails & injection boundaries
      if guardrail = check_policy_guardrails(down, contact)
        return guardrail
      end

      # 3. Intent matching with domain rules
      intent = detect_intent(down)
      sentiment, score = calculate_sentiment(down, intent)
      key_phrases = extract_key_phrases(down)
      objection = extract_objection(down, intent)
      recommended_reply = generate_counter_script(intent, objection, contact, down)

      {
        sentiment: sentiment,
        sentiment_score: score,
        intent_category: intent,
        objection_detail: objection,
        key_phrases: key_phrases,
        recommended_reply: recommended_reply,
        conversion_outcome: intent == 'BOOKING_READY' ? 'Potential Booking — Needs Confirmation' : 'Pending'
      }
    end

    def self.check_policy_guardrails(text, contact = nil)
      name = contact ? contact['first_name'] : 'there'

      # Guardrail A: Prompt Injection & Remote Hardware Valve Control Attempts
      if text.match?(/\b(ignore (all|previous|prior)|system prompt|actuate valve|open valve|close valve|bypass valve|override pressure|shut off rig|disable telemetry|emergency shutdown|root access)\b/)
        return {
          sentiment: 'Negative',
          sentiment_score: -0.5,
          intent_category: 'SECURITY_BOUNDARY_VIOLATION',
          objection_detail: 'Security Policy Alert: Attempted remote hardware valve control or prompt injection',
          key_phrases: ['security', 'hardware_interlock', 'prohibited'],
          recommended_reply: "Remote equipment control is unavailable in this prototype. A human operator must review any field task.",
          conversion_outcome: 'Escalated',
          escalate_to_human: true,
          policy_violation: true
        }
      end

      # Guardrail B: Refund & Reversal Demands (AI Cannot Issue Refunds)
      if text.match?(/\b(refund|give me my money back|chargeback|money back guarantee|reverse payment|demand a refund)\b/)
        return {
          sentiment: 'Negative',
          sentiment_score: -0.8,
          intent_category: 'REFUND_REQUEST_ESCALATION',
          objection_detail: 'Customer requested financial refund; strictly requires owner authorization',
          key_phrases: ['refund', 'supervisor_escalation', 'owner_review'],
          recommended_reply: "Thanks, #{name}. Your request needs human review. This automated analysis does not establish a refund decision or response timeframe.",
          conversion_outcome: 'Escalated',
          escalate_to_human: true,
          policy_violation: false
        }
      end

      # Guardrail C: Discount requests require human review.
      if text.match?(/\b(discount|coupon|free wash|free clean|\$?\d+(?:\.\d+)?\s*(?:off|%))\b/)
        return {
          sentiment: 'Neutral',
          sentiment_score: -0.2,
          intent_category: 'UNAUTHORIZED_DISCOUNT_REQUEST',
          objection_detail: 'Discount request requires human review; no discount terms are approved in this prototype.',
          key_phrases: ['discount_request', 'human_review'],
          recommended_reply: "Thanks, #{name}. A human team member must review pricing or discount requests. No discount is offered or confirmed by this automated message.",
          conversion_outcome: 'Pending',
          escalate_to_human: true,
          policy_violation: false
        }
      end

      nil
    end

    def self.detect_intent(text)
      if text.match?(/\b(subscription|membership|recurring|plan|monthly|biannual|triannual|quarterly|vip|routine|regularly)\b/)
        'SUBSCRIPTION_INQUIRY'
      elsif text.match?(/\b(book|schedule|come out|saturday|friday|monday|tuesday|wednesday|thursday|tomorrow|lock in|sign me up|sounds good|let's do it|lets do it|confirm|what time|available)\b/)
        'BOOKING_READY'
      elsif text.match?(/\b(\d+)\s*(windows?|panes?)\b/) || text.match?(/\b(how much|cost|pricing|price|quote|estimate|rate|fee|per window)\b/)
        'WINDOW_QUOTE_INQUIRY'
      elsif text.match?(/\b(plant|plants|garden|flowers|shrubs|bushes|grass|lawn|pets|dog|cats|bleach|shingle|damage|dent|pressure wash my siding|kill my|safe for|ladder|gutters)\b/)
        'SAFETY_CONCERN'
      elsif text.match?(/\b(expensive|steep|high|cheaper|afford|costly|budget|too much|discount|deal|best price|lower)\b/)
        'PRICE_OBJECTION'
      elsif text.match?(/\b(spring|fall|winter|next month|later|not right now|check back|reach out in|next year|rain|weather|wait until|busy)\b/)
        'TIMING_DELAY'
      elsif text.match?(/\b(husband|wife|spouse|partner|talk to my|check with my|landlord|hoa|board)\b/)
        'SPOUSAL_CHECK'
      elsif text.match?(/\b(include|deck|patio|driveway|sidewalk|gutters|windows|second story|oil stain|moss|roof|extra)\b/)
        'SCOPE_INQUIRY'
      elsif text.match?(/\b(other guy|sparkle|competitor|flyer|coupon|another company|quoted me|beat that)\b/)
        'COMPETITOR_COMPARISON'
      else
        'GENERAL_INQUIRY'
      end
    end

    def self.calculate_sentiment(text, intent)
      pos_words = %w[great good awesome sounds perfect yes please interested love thanks thank ready excited appreciate]
      neg_words = %w[expensive high no dont stop cancel bad terrible rip off scam ridiculous annoyed mad never]

      pos_count = pos_words.count { |w| text.include?(w) }
      neg_count = neg_words.count { |w| text.include?(w) }

      score = ((pos_count - neg_count) * 0.35).clamp(-1.0, 1.0)

      # Weight by intent
      case intent
      when 'BOOKING_READY'
        score = [score + 0.6, 0.95].min
        ['Positive', score.round(2)]
      when 'WINDOW_QUOTE_INQUIRY', 'SUBSCRIPTION_INQUIRY'
        score = [score + 0.3, 0.7].min
        ['Positive', score.round(2)]
      when 'PRICE_OBJECTION'
        score = [score - 0.3, -0.4].min
        ['Negative', score.round(2)]
      when 'SAFETY_CONCERN'
        score = -0.15
        ['Neutral', score.round(2)]
      when 'TIMING_DELAY'
        ['Neutral', 0.0]
      when 'OPT_OUT'
        ['Negative', -0.9]
      else
        if score > 0.2
          ['Positive', score.round(2)]
        elsif score < -0.2
          ['Negative', score.round(2)]
        else
          ['Neutral', score.round(2)]
        end
      end
    end

    def self.extract_key_phrases(text)
      tokens = text.scan(/\b[a-z]{4,}\b/)
      stopwords = %w[that this with have from your what will would could there they been their about which when them then]
      (tokens - stopwords).uniq.take(5)
    end

    def self.extract_objection(text, intent)
      case intent
      when 'WINDOW_QUOTE_INQUIRY'
        'Homeowner requesting window quote or pane rate breakdown'
      when 'SUBSCRIPTION_INQUIRY'
        'Inquiring about recurring membership maintenance tiers'
      when 'PRICE_OBJECTION'
        if text.include?('budget')
          'Out of homeowner budget allocation'
        elsif text.include?('cheaper')
          'Comparing to lower generic market rate'
        else
          'Sticker shock on flat pricing'
        end
      when 'SAFETY_CONCERN'
        if text.match?(/\b(plant|flower|shrub|garden)\b/)
          'Fear of chemical runoff killing expensive landscaping'
        elsif text.match?(/\b(pet|dog|cat)\b/)
          'Pet safety and chemical residue on grass/patios'
        else
          'Fear of ladders denting gutters or scratching siding'
        end
      when 'TIMING_DELAY'
        if text.include?('spring')
          'Deferring to annual Spring cleaning cycle'
        else
          'Temporary timing conflict / weather delay'
        end
      when 'SPOUSAL_CHECK'
        'Decision maker split - joint approval needed'
      when 'COMPETITOR_COMPARISON'
        'Direct competitor quote or mailer coupon leverage'
      when 'SCOPE_INQUIRY'
        'Uncertain if estimate is all-inclusive or upsell'
      when 'BOOKING_READY'
        'None - ready to schedule'
      when 'OPT_OUT'
        'Unsubscribe requested'
      else
        'Standard informational request'
      end
    end

    def self.generate_counter_script(intent, objection, contact = nil, text = '')
      name = contact ? contact['first_name'].to_s : 'there'
      greeting = "Thanks, #{name}."
      case intent
      when 'WINDOW_QUOTE_INQUIRY', 'SUBSCRIPTION_INQUIRY'
        "#{greeting} Our team needs to verify current services, prices, and terms before responding. No estimate or plan is confirmed here."
      when 'BOOKING_READY'
        "#{greeting} Our team will check the current schedule. No appointment is confirmed until a team member verifies the details."
      when 'PRICE_OBJECTION'
        "#{greeting} Our team will review your question. This message does not offer or confirm a discount."
      when 'SAFETY_CONCERN'
        "#{greeting} Our team needs to verify the relevant product and process details before answering. No safety guarantee is made here."
      when 'TIMING_DELAY', 'SPOUSAL_CHECK', 'SCOPE_INQUIRY', 'COMPETITOR_COMPARISON'
        "#{greeting} A team member will review your question and follow up with current information."
      else
        "#{greeting} A team member will review your message and follow up with current information."
      end
    end

    # Aggregate intelligence report across all recorded responses
    def self.generate_intelligence_report(db)
      total_contacts = db.get_first_row("SELECT COUNT(*) as count FROM contacts")['count'] || 0
      total_sent = db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'outbound'")['count'] || 0
      total_received = db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'inbound'")['count'] || 0
      total_responses = db.get_first_row("SELECT COUNT(*) as count FROM responses")['count'] || 0

      # Sentiment stats
      sentiments = db.execute("SELECT sentiment, COUNT(*) as count FROM responses GROUP BY sentiment")
      sentiment_map = sentiments.each_with_object({}) { |r, h| h[r['sentiment']] = r['count'] }

      # Intent stats
      intents = db.execute("SELECT intent_category, COUNT(*) as count FROM responses GROUP BY intent_category ORDER BY count DESC")
      intent_map = intents.map do |row|
        category_info = INTENT_CATEGORIES[row['intent_category']] || { name: row['intent_category'], color: '#6b7280' }
        {
          key: row['intent_category'],
          label: category_info[:name],
          color: category_info[:color],
          count: row['count'],
          percentage: total_responses > 0 ? (row['count'].to_f / total_responses * 100).round(1) : 0
        }
      end

      # Objections detail
      objections = db.execute("SELECT objection_detail, COUNT(*) as count FROM responses WHERE intent_category != 'BOOKING_READY' AND intent_category != 'OPT_OUT' GROUP BY objection_detail ORDER BY count DESC LIMIT 6")

      # Channel performance
      sms_sent = db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'outbound' AND channel = 'SMS'")['count'] || 0
      sms_recv = db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'inbound' AND channel = 'SMS'")['count'] || 0
      email_sent = db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'outbound' AND channel = 'Email'")['count'] || 0
      email_recv = db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'inbound' AND channel = 'Email'")['count'] || 0

      sms_reply_rate = sms_sent > 0 ? (sms_recv.to_f / sms_sent * 100).round(1) : 0
      email_reply_rate = email_sent > 0 ? (email_recv.to_f / email_sent * 100).round(1) : 0

      # Marketing Action Recommendations
      recommendations = generate_strategic_recommendations(intent_map, objections, sms_reply_rate, email_reply_rate)

      {
        total_contacts: total_contacts,
        total_messages_sent: total_sent,
        total_messages_received: total_received,
        total_responses_analyzed: total_responses,
        overall_reply_rate: total_sent > 0 ? (total_received.to_f / total_sent * 100).round(1) : 0,
        sentiments: {
          positive: sentiment_map['Positive'] || 0,
          neutral: sentiment_map['Neutral'] || 0,
          negative: sentiment_map['Negative'] || 0
        },
        intents: intent_map,
        top_objections: objections,
        channel_metrics: {
          sms: { sent: sms_sent, received: sms_recv, reply_rate: sms_reply_rate },
          email: { sent: email_sent, received: email_recv, reply_rate: email_reply_rate }
        },
        recommendations: recommendations
      }
    end

    def self.generate_strategic_recommendations(intents, objections, sms_rate, email_rate)
      intents.filter { |item| item[:count].to_i > 0 }.map do |item|
        {
          category: 'Human review',
          title: "Review #{item[:label]} classifications",
          finding: "#{item[:count]} recorded messages received this automated classification.",
          impact: 'Not measured',
          recommendation: 'Review the source messages and verify current facts before taking action or contacting a customer.',
          priority: 'Review'
        }
      end
    end
  end
end
