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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      area_interesse: {
        Row: {
          ativo: boolean
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
        }
        Relationships: []
      }
      assunto: {
        Row: {
          ativo: boolean
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
        }
        Relationships: []
      }
      assunto_area_interesse: {
        Row: {
          area_interesse_id: number
          assunto_id: number
          ativo: boolean
          id: number
        }
        Insert: {
          area_interesse_id: number
          assunto_id: number
          ativo?: boolean
          id?: never
        }
        Update: {
          area_interesse_id?: number
          assunto_id?: number
          ativo?: boolean
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "assunto_area_interesse_area_interesse_id_fkey"
            columns: ["area_interesse_id"]
            isOneToOne: false
            referencedRelation: "area_interesse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assunto_area_interesse_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assunto"
            referencedColumns: ["id"]
          },
        ]
      }
      assunto_subassunto: {
        Row: {
          assunto_id: number
          ativo: boolean
          id: number
          subassunto_id: number
        }
        Insert: {
          assunto_id: number
          ativo?: boolean
          id?: never
          subassunto_id: number
        }
        Update: {
          assunto_id?: number
          ativo?: boolean
          id?: never
          subassunto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "assunto_subassunto_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assunto_subassunto_subassunto_id_fkey"
            columns: ["subassunto_id"]
            isOneToOne: false
            referencedRelation: "subassunto"
            referencedColumns: ["id"]
          },
        ]
      }
      assunto_tipo_ocorrencia: {
        Row: {
          assunto_id: number
          ativo: boolean
          id: number
          tipo_ocorrencia_id: number
        }
        Insert: {
          assunto_id: number
          ativo?: boolean
          id?: never
          tipo_ocorrencia_id: number
        }
        Update: {
          assunto_id?: number
          ativo?: boolean
          id?: never
          tipo_ocorrencia_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "assunto_tipo_ocorrencia_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assunto_tipo_ocorrencia_tipo_ocorrencia_id_fkey"
            columns: ["tipo_ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "tipo_ocorrencia"
            referencedColumns: ["id"]
          },
        ]
      }
      canal: {
        Row: {
          ativo: boolean
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
        }
        Relationships: []
      }
      canal_origem: {
        Row: {
          ativo: boolean
          canal_id: number
          id: number
          origem_id: number
        }
        Insert: {
          ativo?: boolean
          canal_id: number
          id?: never
          origem_id: number
        }
        Update: {
          ativo?: boolean
          canal_id?: number
          id?: never
          origem_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "canal_origem_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canal_origem_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origem"
            referencedColumns: ["id"]
          },
        ]
      }
      criticidade: {
        Row: {
          ativo: boolean
          id: number
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      detalhe_ocorrencia: {
        Row: {
          ativo: boolean
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
        }
        Relationships: []
      }
      origem: {
        Row: {
          ativo: boolean
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
        }
        Relationships: []
      }
      regra_criticidade: {
        Row: {
          assunto_id: number
          ativo: boolean
          criticidade_id: number
          id: number
          subassunto_id: number | null
          tipo_ocorrencia_id: number
        }
        Insert: {
          assunto_id: number
          ativo?: boolean
          criticidade_id: number
          id?: never
          subassunto_id?: number | null
          tipo_ocorrencia_id: number
        }
        Update: {
          assunto_id?: number
          ativo?: boolean
          criticidade_id?: number
          id?: never
          subassunto_id?: number | null
          tipo_ocorrencia_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "regra_criticidade_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regra_criticidade_criticidade_id_fkey"
            columns: ["criticidade_id"]
            isOneToOne: false
            referencedRelation: "criticidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regra_criticidade_subassunto_id_fkey"
            columns: ["subassunto_id"]
            isOneToOne: false
            referencedRelation: "subassunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regra_criticidade_tipo_ocorrencia_id_fkey"
            columns: ["tipo_ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "tipo_ocorrencia"
            referencedColumns: ["id"]
          },
        ]
      }
      subassunto: {
        Row: {
          ativo: boolean
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
        }
        Relationships: []
      }
      subassunto_detalhe: {
        Row: {
          ativo: boolean
          detalhe_ocorrencia_id: number
          id: number
          subassunto_id: number
        }
        Insert: {
          ativo?: boolean
          detalhe_ocorrencia_id: number
          id?: never
          subassunto_id: number
        }
        Update: {
          ativo?: boolean
          detalhe_ocorrencia_id?: number
          id?: never
          subassunto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subassunto_detalhe_detalhe_ocorrencia_id_fkey"
            columns: ["detalhe_ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "detalhe_ocorrencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subassunto_detalhe_subassunto_id_fkey"
            columns: ["subassunto_id"]
            isOneToOne: false
            referencedRelation: "subassunto"
            referencedColumns: ["id"]
          },
        ]
      }
      tabulacoes_registradas: {
        Row: {
          area_interesse_id: number
          assunto_id: number
          canal_id: number
          criticidade_id: number
          data_hora_inclusao: string
          detalhe_ocorrencia_id: number | null
          id_registro: number
          nome_usuario: string
          origem_id: number
          setor_usuario: string
          subassunto_id: number | null
          tipo_ocorrencia_id: number
        }
        Insert: {
          area_interesse_id: number
          assunto_id: number
          canal_id: number
          criticidade_id: number
          data_hora_inclusao?: string
          detalhe_ocorrencia_id?: number | null
          id_registro?: never
          nome_usuario: string
          origem_id: number
          setor_usuario: string
          subassunto_id?: number | null
          tipo_ocorrencia_id: number
        }
        Update: {
          area_interesse_id?: number
          assunto_id?: number
          canal_id?: number
          criticidade_id?: number
          data_hora_inclusao?: string
          detalhe_ocorrencia_id?: number | null
          id_registro?: never
          nome_usuario?: string
          origem_id?: number
          setor_usuario?: string
          subassunto_id?: number | null
          tipo_ocorrencia_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tabulacoes_registradas_area_interesse_id_fkey"
            columns: ["area_interesse_id"]
            isOneToOne: false
            referencedRelation: "area_interesse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_criticidade_id_fkey"
            columns: ["criticidade_id"]
            isOneToOne: false
            referencedRelation: "criticidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_detalhe_ocorrencia_id_fkey"
            columns: ["detalhe_ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "detalhe_ocorrencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_subassunto_id_fkey"
            columns: ["subassunto_id"]
            isOneToOne: false
            referencedRelation: "subassunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_tipo_ocorrencia_id_fkey"
            columns: ["tipo_ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "tipo_ocorrencia"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_ocorrencia: {
        Row: {
          ativo: boolean
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: never
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: never
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_tabulacoes: {
        Row: {
          area_interesse: string | null
          area_interesse_id: number | null
          assunto: string | null
          assunto_id: number | null
          canal: string | null
          canal_id: number | null
          criticidade: string | null
          criticidade_id: number | null
          criticidade_ordem: number | null
          data_hora_inclusao: string | null
          detalhe_ocorrencia: string | null
          detalhe_ocorrencia_id: number | null
          id_registro: number | null
          nome_usuario: string | null
          origem: string | null
          origem_id: number | null
          setor_usuario: string | null
          subassunto: string | null
          subassunto_id: number | null
          tipo_ocorrencia: string | null
          tipo_ocorrencia_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tabulacoes_registradas_area_interesse_id_fkey"
            columns: ["area_interesse_id"]
            isOneToOne: false
            referencedRelation: "area_interesse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_criticidade_id_fkey"
            columns: ["criticidade_id"]
            isOneToOne: false
            referencedRelation: "criticidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_detalhe_ocorrencia_id_fkey"
            columns: ["detalhe_ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "detalhe_ocorrencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origem"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_subassunto_id_fkey"
            columns: ["subassunto_id"]
            isOneToOne: false
            referencedRelation: "subassunto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabulacoes_registradas_tipo_ocorrencia_id_fkey"
            columns: ["tipo_ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "tipo_ocorrencia"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calcular_criticidade: {
        Args: { p_assunto: number; p_sub: number; p_tipo: number }
        Returns: number
      }
      excluir_tabulacao: { Args: { p_id: number }; Returns: undefined }
      inserir_tabulacao: {
        Args: {
          p_area: number
          p_assunto: number
          p_canal: number
          p_detalhe: number
          p_nome: string
          p_origem: number
          p_setor: string
          p_sub: number
          p_tipo: number
        }
        Returns: number
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
