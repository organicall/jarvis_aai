export const importTemplates = [
  {
    table: 'clients',
    label: 'Clients',
    columns: [
      'client_id',
      'client_name',
      'client_type',
      'adviser_name',
      'status',
      'primary_email',
      'primary_mobile',
      'address',
      'postcode',
      'combined_income',
      'net_worth',
      'risk_profile',
      'last_review_date',
      'next_review_date',
      'review_frequency_months'
    ]
  },
  {
    table: 'client_persons',
    label: 'Client Persons',
    columns: [
      'client_id',
      'first_name',
      'last_name',
      'dob',
      'age',
      'relationship',
      'email',
      'mobile',
      'occupation',
      'employer',
      'employment_type',
      'salary',
      'bonus_avg',
      'notes'
    ]
  },
  {
    table: 'properties',
    label: 'Properties',
    columns: [
      'client_id',
      'property_type',
      'address',
      'postcode',
      'current_value',
      'purchase_price',
      'purchase_date',
      'has_mortgage',
      'mortgage_balance',
      'mortgage_rate',
      'mortgage_type',
      'mortgage_fixed_until',
      'mortgage_monthly_payment',
      'mortgage_term_years',
      'rental_income_annual',
      'notes'
    ]
  },
  {
    table: 'assets',
    label: 'Assets',
    columns: [
      'client_id',
      'person_id',
      'asset_type',
      'asset_name',
      'provider',
      'current_value',
      'allocation_equities',
      'allocation_bonds',
      'allocation_cash',
      'allocation_other',
      'isa_allowance_used_current_year',
      'isa_allowance_remaining',
      'interest_rate',
      'notes'
    ]
  },
  {
    table: 'pensions',
    label: 'Pensions',
    columns: [
      'client_id',
      'person_id',
      'pension_type',
      'pension_name',
      'provider',
      'dc_current_value',
      'dc_contribution_employee',
      'dc_contribution_employer',
      'dc_contribution_frequency',
      'db_accrued_annual',
      'db_in_payment',
      'db_payment_amount',
      'annual_allowance_used',
      'annual_allowance_remaining',
      'status',
      'notes'
    ]
  },
  {
    table: 'protection',
    label: 'Protection',
    columns: [
      'client_id',
      'person_id',
      'protection_type',
      'provider',
      'policy_number',
      'cover_amount',
      'monthly_premium',
      'start_date',
      'expiry_date',
      'in_trust',
      'trust_beneficiaries',
      'ip_deferred_period_weeks',
      'ip_benefit_period',
      'ip_monthly_benefit',
      'status',
      'notes'
    ]
  },
  {
    table: 'goals',
    label: 'Goals',
    columns: [
      'client_id',
      'goal_type',
      'goal_name',
      'description',
      'target_amount',
      'current_progress',
      'target_date',
      'years_remaining',
      'priority',
      'status',
      'notes'
    ]
  },
  {
    table: 'recommendations',
    label: 'Recommendations',
    columns: [
      'client_id',
      'recommendation_date',
      'recommendation_type',
      'recommendation_title',
      'recommendation_description',
      'rationale',
      'status',
      'estimated_value',
      'tax_saving',
      'cost',
      'implementation_date',
      'review_date',
      'notes'
    ]
  },
  {
    table: 'opportunities',
    label: 'Opportunities',
    columns: [
      'client_id',
      'opportunity_type',
      'opportunity_title',
      'opportunity_description',
      'urgency',
      'deadline',
      'potential_value',
      'potential_saving',
      'status',
      'identified_date',
      'actioned_date',
      'notes'
    ]
  },
  {
    table: 'risks',
    label: 'Risks',
    columns: [
      'client_id',
      'risk_type',
      'risk_title',
      'risk_description',
      'severity',
      'potential_impact',
      'financial_impact',
      'mitigation_plan',
      'mitigation_status',
      'identified_date',
      'target_resolution_date',
      'resolved_date',
      'notes'
    ]
  },
  {
    table: 'communications',
    label: 'Communications',
    columns: [
      'client_id',
      'communication_type',
      'communication_date',
      'subject',
      'notes',
      'action_items',
      'commitments_made',
      'attendees',
      'follow_up_required',
      'follow_up_date',
      'follow_up_completed'
    ]
  },
  {
    table: 'actions',
    label: 'Actions',
    columns: [
      'client_id',
      'action_title',
      'action_description',
      'action_type',
      'assigned_to',
      'status',
      'priority',
      'due_date',
      'completed_date',
      'related_recommendation_id',
      'related_communication_id',
      'notes'
    ]
  },
  {
    table: 'documents',
    label: 'Documents',
    columns: [
      'client_id',
      'document_type',
      'document_name',
      'document_description',
      'status',
      'requested_date',
      'received_date',
      'expiry_date',
      'file_path',
      'file_url',
      'notes'
    ]
  },
  {
    table: 'tax_positions',
    label: 'Tax Positions',
    columns: [
      'client_id',
      'person_id',
      'tax_year',
      'employment_income',
      'dividend_income',
      'rental_income',
      'pension_income',
      'other_income',
      'total_income',
      'adjusted_income',
      'personal_allowance',
      'tax_band',
      'pension_contribution_annual',
      'isa_used',
      'income_tax_paid',
      'ni_paid',
      'pa_lost',
      'tax_inefficiencies',
      'notes'
    ]
  }
];
