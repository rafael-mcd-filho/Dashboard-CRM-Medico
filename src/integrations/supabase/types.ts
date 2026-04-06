export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      contatos: {
        Row: {
          id: string
          contato_id: string
          nome: string | null
          tags: string | null
          origem_contato: string | null
          criado_em: string | null
          numero: string | null
        }
        Insert: {
          id?: string
          contato_id: string
          nome?: string | null
          tags?: string | null
          origem_contato?: string | null
          criado_em?: string | null
          numero?: string | null
        }
        Update: {
          id?: string
          contato_id?: string
          nome?: string | null
          tags?: string | null
          origem_contato?: string | null
          criado_em?: string | null
          numero?: string | null
        }
        Relationships: []
      }
      dashboard_access: {
        Row: {
          active: boolean
          auth_user_id: string
          created_at: string
          external_userid: string
          id: number
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          created_at?: string
          external_userid: string
          id?: never
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          created_at?: string
          external_userid?: string
          id?: never
        }
        Relationships: []
      }
      broncoscopia: {
        Row: {
          contato_id: string | null
          created_at: string
          custo: string | null
          data_agendamento: string | null
          data_atualizacao_card: string | null
          data_atualizacao_conversa: string | null
          data_criacao_card: string | null
          data_pagamento: string | null
          descricao_card: string | null
          etapa_no_crm: string | null
          funil_painel_crm: string | null
          horario_agendamento: string | null
          id: string
          id_do_card: string | null
          key: string
          link_da_conversa: string | null
          modalidade_pagamento: string | null
          nome_contato: string | null
          quantidade_codigos: string | null
          responsavel: string | null
          tag_id_card: string | null
          tag_names_card: string | null
          tipo_paciente: string | null
          valor_atribuido: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          custo?: string | null
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          key: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          quantidade_codigos?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          tipo_paciente?: string | null
          valor_atribuido?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          custo?: string | null
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          key?: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          quantidade_codigos?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          tipo_paciente?: string | null
          valor_atribuido?: string | null
        }
        Relationships: []
      }
      consultas: {
        Row: {
          contato_id: string | null
          created_at: string
          data_agendamento: string | null
          data_atualizacao_card: string | null
          data_atualizacao_conversa: string | null
          data_criacao_card: string | null
          data_pagamento: string | null
          descricao_card: string | null
          etapa_no_crm: string | null
          funil_painel_crm: string | null
          horario_agendamento: string | null
          id: string
          id_do_card: string | null
          key: string
          link_da_conversa: string | null
          modalidade_pagamento: string | null
          nome_contato: string | null
          responsavel: string | null
          tag_id_card: string | null
          tag_names_card: string | null
          tipo_consulta: string | null
          valor_atribuido: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          key: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          tipo_consulta?: string | null
          valor_atribuido?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          key?: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          tipo_consulta?: string | null
          valor_atribuido?: string | null
        }
        Relationships: []
      }
      espirometria: {
        Row: {
          contato_id: string | null
          created_at: string
          data_agendamento: string | null
          data_atualizacao_card: string | null
          data_atualizacao_conversa: string | null
          data_criacao_card: string | null
          data_pagamento: string | null
          descricao_card: string | null
          etapa_no_crm: string | null
          funil_painel_crm: string | null
          horario_agendamento: string | null
          id: string
          id_do_card: string | null
          key: string
          link_da_conversa: string | null
          modalidade_pagamento: string | null
          nome_contato: string | null
          responsavel: string | null
          tag_id_card: string | null
          tag_names_card: string | null
          valor_atribuido: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          key: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          valor_atribuido?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          key?: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          valor_atribuido?: string | null
        }
        Relationships: []
      }
      procedimentos_cirurgicos: {
        Row: {
          contato_id: string | null
          created_at: string
          custo_anestesia: string | null
          custo_comissao: string | null
          custo_hospital: string | null
          custo_instrumentacao: string | null
          data_agendamento: string | null
          data_atualizacao_card: string | null
          data_atualizacao_conversa: string | null
          data_criacao_card: string | null
          data_pagamento: string | null
          descricao_card: string | null
          etapa_no_crm: string | null
          funil_painel_crm: string | null
          horario_agendamento: string | null
          id: string
          id_do_card: string | null
          impostos: string | null
          key: string
          link_da_conversa: string | null
          modalidade_pagamento: string | null
          nome_contato: string | null
          responsavel: string | null
          tag_id_card: string | null
          tag_names_card: string | null
          tipo_paciente: string | null
          valor_atribuido: string | null
          valor_liquido: number | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          custo_anestesia?: string | null
          custo_comissao?: string | null
          custo_hospital?: string | null
          custo_instrumentacao?: string | null
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          impostos?: string | null
          key: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          tipo_paciente?: string | null
          valor_atribuido?: string | null
          valor_liquido?: number | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          custo_anestesia?: string | null
          custo_comissao?: string | null
          custo_hospital?: string | null
          custo_instrumentacao?: string | null
          data_agendamento?: string | null
          data_atualizacao_card?: string | null
          data_atualizacao_conversa?: string | null
          data_criacao_card?: string | null
          data_pagamento?: string | null
          descricao_card?: string | null
          etapa_no_crm?: string | null
          funil_painel_crm?: string | null
          horario_agendamento?: string | null
          id?: string
          id_do_card?: string | null
          impostos?: string | null
          key?: string
          link_da_conversa?: string | null
          modalidade_pagamento?: string | null
          nome_contato?: string | null
          responsavel?: string | null
          tag_id_card?: string | null
          tag_names_card?: string | null
          tipo_paciente?: string | null
          valor_atribuido?: string | null
          valor_liquido?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
