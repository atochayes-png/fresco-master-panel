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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alojamiento_bloqueos: {
        Row: {
          alojamiento_id: string
          creado_en: string
          fecha: string
          id: string
          negocio_id: string
          unidades: number
        }
        Insert: {
          alojamiento_id: string
          creado_en?: string
          fecha: string
          id?: string
          negocio_id: string
          unidades?: number
        }
        Update: {
          alojamiento_id?: string
          creado_en?: string
          fecha?: string
          id?: string
          negocio_id?: string
          unidades?: number
        }
        Relationships: [
          {
            foreignKeyName: "alojamiento_bloqueos_alojamiento_id_fkey"
            columns: ["alojamiento_id"]
            isOneToOne: false
            referencedRelation: "negocio_alojamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alojamiento_bloqueos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      alojamiento_medios: {
        Row: {
          alojamiento_id: string
          bytes: number | null
          creado_en: string
          duration: number | null
          es_portada: boolean
          format: string | null
          id: string
          negocio_id: string
          orden: number
          public_id: string
          resource_type: string
          secure_url: string
          tipo: string
        }
        Insert: {
          alojamiento_id: string
          bytes?: number | null
          creado_en?: string
          duration?: number | null
          es_portada?: boolean
          format?: string | null
          id?: string
          negocio_id: string
          orden?: number
          public_id: string
          resource_type?: string
          secure_url: string
          tipo?: string
        }
        Update: {
          alojamiento_id?: string
          bytes?: number | null
          creado_en?: string
          duration?: number | null
          es_portada?: boolean
          format?: string | null
          id?: string
          negocio_id?: string
          orden?: number
          public_id?: string
          resource_type?: string
          secure_url?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alojamiento_medios_alojamiento_id_fkey"
            columns: ["alojamiento_id"]
            isOneToOne: false
            referencedRelation: "negocio_alojamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alojamiento_medios_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      experiencia_medios: {
        Row: {
          bytes: number | null
          creado_en: string
          duration: number | null
          es_portada: boolean
          experiencia_id: string
          format: string | null
          id: string
          negocio_id: string
          orden: number
          public_id: string
          resource_type: string
          secure_url: string
          tipo: string
        }
        Insert: {
          bytes?: number | null
          creado_en?: string
          duration?: number | null
          es_portada?: boolean
          experiencia_id: string
          format?: string | null
          id?: string
          negocio_id: string
          orden?: number
          public_id: string
          resource_type?: string
          secure_url: string
          tipo?: string
        }
        Update: {
          bytes?: number | null
          creado_en?: string
          duration?: number | null
          es_portada?: boolean
          experiencia_id?: string
          format?: string | null
          id?: string
          negocio_id?: string
          orden?: number
          public_id?: string
          resource_type?: string
          secure_url?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiencia_medios_experiencia_id_fkey"
            columns: ["experiencia_id"]
            isOneToOne: false
            referencedRelation: "negocio_experiencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiencia_medios_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      guardados: {
        Row: {
          creado_en: string
          id: string
          negocio_id: string
          telefono: string
        }
        Insert: {
          creado_en?: string
          id?: string
          negocio_id: string
          telefono: string
        }
        Update: {
          creado_en?: string
          id?: string
          negocio_id?: string
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardados_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      medios_pendientes_borrado: {
        Row: {
          creado_en: string
          id: string
          procesado: boolean
          public_id: string
          resource_type: string
        }
        Insert: {
          creado_en?: string
          id?: string
          procesado?: boolean
          public_id: string
          resource_type?: string
        }
        Update: {
          creado_en?: string
          id?: string
          procesado?: boolean
          public_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      negocio_alojamientos: {
        Row: {
          activo: boolean
          actualizado_en: string
          camas: number | null
          capacidad: number
          creado_en: string
          descripcion: string | null
          id: string
          negocio_id: string
          nombre: string
          orden: number
          precio: number | null
          precio_tipo: string
          servicios: string[]
          tipo: string
          tipo_camas: string | null
          unidades: number
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          camas?: number | null
          capacidad?: number
          creado_en?: string
          descripcion?: string | null
          id?: string
          negocio_id: string
          nombre: string
          orden?: number
          precio?: number | null
          precio_tipo?: string
          servicios?: string[]
          tipo?: string
          tipo_camas?: string | null
          unidades?: number
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          camas?: number | null
          capacidad?: number
          creado_en?: string
          descripcion?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          orden?: number
          precio?: number | null
          precio_tipo?: string
          servicios?: string[]
          tipo?: string
          tipo_camas?: string | null
          unidades?: number
        }
        Relationships: [
          {
            foreignKeyName: "negocio_alojamientos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_experiencias: {
        Row: {
          activa: boolean
          actualizado_en: string
          capacidad: number | null
          categoria: string | null
          creado_en: string
          descripcion: string | null
          duracion: string | null
          extras: Json
          foto_portada: string | null
          horarios: string[]
          id: string
          negocio_id: string
          nombre: string
          orden: number
          precio: number | null
          precio_tipo: string
          punto_salida: string | null
          requiere_anticipo: boolean
          salida_latitud: number | null
          salida_longitud: number | null
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          capacidad?: number | null
          categoria?: string | null
          creado_en?: string
          descripcion?: string | null
          duracion?: string | null
          extras?: Json
          foto_portada?: string | null
          horarios?: string[]
          id?: string
          negocio_id: string
          nombre: string
          orden?: number
          precio?: number | null
          precio_tipo?: string
          punto_salida?: string | null
          requiere_anticipo?: boolean
          salida_latitud?: number | null
          salida_longitud?: number | null
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          capacidad?: number | null
          categoria?: string | null
          creado_en?: string
          descripcion?: string | null
          duracion?: string | null
          extras?: Json
          foto_portada?: string | null
          horarios?: string[]
          id?: string
          negocio_id?: string
          nombre?: string
          orden?: number
          precio?: number | null
          precio_tipo?: string
          punto_salida?: string | null
          requiere_anticipo?: boolean
          salida_latitud?: number | null
          salida_longitud?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negocio_experiencias_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_fotos: {
        Row: {
          actualizado_en: string
          creado_en: string
          id: string
          negocio_id: string
          orden: number
          ruta: string
          url: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          negocio_id: string
          orden?: number
          ruta: string
          url: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          negocio_id?: string
          orden?: number
          ruta?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_fotos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_horarios: {
        Row: {
          abierto: boolean
          actualizado_en: string
          apertura: string | null
          cierre: string | null
          creado_en: string
          dia: number
          id: string
          negocio_id: string
        }
        Insert: {
          abierto?: boolean
          actualizado_en?: string
          apertura?: string | null
          cierre?: string | null
          creado_en?: string
          dia: number
          id?: string
          negocio_id: string
        }
        Update: {
          abierto?: boolean
          actualizado_en?: string
          apertura?: string | null
          cierre?: string | null
          creado_en?: string
          dia?: number
          id?: string
          negocio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_horarios_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_medios: {
        Row: {
          actualizado_en: string
          bytes: number | null
          created_at: string
          duration: number | null
          es_destacado: boolean
          es_portada: boolean
          format: string | null
          height: number | null
          id: string
          negocio_id: string
          orden: number
          public_id: string
          resource_type: string
          secure_url: string
          tipo: string
          width: number | null
        }
        Insert: {
          actualizado_en?: string
          bytes?: number | null
          created_at?: string
          duration?: number | null
          es_destacado?: boolean
          es_portada?: boolean
          format?: string | null
          height?: number | null
          id?: string
          negocio_id: string
          orden?: number
          public_id: string
          resource_type?: string
          secure_url: string
          tipo: string
          width?: number | null
        }
        Update: {
          actualizado_en?: string
          bytes?: number | null
          created_at?: string
          duration?: number | null
          es_destacado?: boolean
          es_portada?: boolean
          format?: string | null
          height?: number | null
          id?: string
          negocio_id?: string
          orden?: number
          public_id?: string
          resource_type?: string
          secure_url?: string
          tipo?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negocio_medios_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_perfil: {
        Row: {
          acepta_mascotas: boolean
          acepta_ninos: boolean
          actualizado_en: string
          atiende_local: boolean
          atiende_recoger: boolean
          capacidad: number | null
          checkin: string | null
          checkout: string | null
          codigo_postal: string | null
          colonia: string | null
          comida_tipos: string[]
          costo_entrega: number | null
          costo_entrega_tipo: string | null
          creado_en: string
          descripcion: string | null
          direccion: string | null
          distancia_km: number | null
          domicilio: boolean | null
          duracion: string | null
          facebook: string | null
          formas_pago: string[]
          foto_principal: string | null
          instagram: string | null
          latitud: number | null
          longitud: number | null
          menu_tipo: string | null
          menu_url: string | null
          negocio_id: string
          notas_entrega: string | null
          notas_hospedaje: string | null
          paso_actual: number
          precio_desde: number | null
          precio_noche: number | null
          precio_promedio: number | null
          punto_salida: string | null
          recibe_clientes: boolean | null
          recibe_pedidos: boolean
          renta_deposito: boolean
          renta_edad_minima: number | null
          renta_entrega_costo: number | null
          renta_entrega_costo_tipo: string
          renta_entrega_opciones: string[]
          renta_identificacion: boolean
          renta_licencia: boolean
          renta_notas: string | null
          renta_requisitos_notas: string | null
          renta_tarjeta: string
          renta_usa_calendario: boolean
          requiere_anticipo: boolean
          salida_latitud: number | null
          salida_longitud: number | null
          sitio_web: string | null
          solo_reservacion: boolean
          tiempo_preparacion: string | null
          tipo_servicio: string | null
          usa_calendario: boolean
          whatsapp_activo: boolean
          whatsapp_numero: string | null
        }
        Insert: {
          acepta_mascotas?: boolean
          acepta_ninos?: boolean
          actualizado_en?: string
          atiende_local?: boolean
          atiende_recoger?: boolean
          capacidad?: number | null
          checkin?: string | null
          checkout?: string | null
          codigo_postal?: string | null
          colonia?: string | null
          comida_tipos?: string[]
          costo_entrega?: number | null
          costo_entrega_tipo?: string | null
          creado_en?: string
          descripcion?: string | null
          direccion?: string | null
          distancia_km?: number | null
          domicilio?: boolean | null
          duracion?: string | null
          facebook?: string | null
          formas_pago?: string[]
          foto_principal?: string | null
          instagram?: string | null
          latitud?: number | null
          longitud?: number | null
          menu_tipo?: string | null
          menu_url?: string | null
          negocio_id: string
          notas_entrega?: string | null
          notas_hospedaje?: string | null
          paso_actual?: number
          precio_desde?: number | null
          precio_noche?: number | null
          precio_promedio?: number | null
          punto_salida?: string | null
          recibe_clientes?: boolean | null
          recibe_pedidos?: boolean
          renta_deposito?: boolean
          renta_edad_minima?: number | null
          renta_entrega_costo?: number | null
          renta_entrega_costo_tipo?: string
          renta_entrega_opciones?: string[]
          renta_identificacion?: boolean
          renta_licencia?: boolean
          renta_notas?: string | null
          renta_requisitos_notas?: string | null
          renta_tarjeta?: string
          renta_usa_calendario?: boolean
          requiere_anticipo?: boolean
          salida_latitud?: number | null
          salida_longitud?: number | null
          sitio_web?: string | null
          solo_reservacion?: boolean
          tiempo_preparacion?: string | null
          tipo_servicio?: string | null
          usa_calendario?: boolean
          whatsapp_activo?: boolean
          whatsapp_numero?: string | null
        }
        Update: {
          acepta_mascotas?: boolean
          acepta_ninos?: boolean
          actualizado_en?: string
          atiende_local?: boolean
          atiende_recoger?: boolean
          capacidad?: number | null
          checkin?: string | null
          checkout?: string | null
          codigo_postal?: string | null
          colonia?: string | null
          comida_tipos?: string[]
          costo_entrega?: number | null
          costo_entrega_tipo?: string | null
          creado_en?: string
          descripcion?: string | null
          direccion?: string | null
          distancia_km?: number | null
          domicilio?: boolean | null
          duracion?: string | null
          facebook?: string | null
          formas_pago?: string[]
          foto_principal?: string | null
          instagram?: string | null
          latitud?: number | null
          longitud?: number | null
          menu_tipo?: string | null
          menu_url?: string | null
          negocio_id?: string
          notas_entrega?: string | null
          notas_hospedaje?: string | null
          paso_actual?: number
          precio_desde?: number | null
          precio_noche?: number | null
          precio_promedio?: number | null
          punto_salida?: string | null
          recibe_clientes?: boolean | null
          recibe_pedidos?: boolean
          renta_deposito?: boolean
          renta_edad_minima?: number | null
          renta_entrega_costo?: number | null
          renta_entrega_costo_tipo?: string
          renta_entrega_opciones?: string[]
          renta_identificacion?: boolean
          renta_licencia?: boolean
          renta_notas?: string | null
          renta_requisitos_notas?: string | null
          renta_tarjeta?: string
          renta_usa_calendario?: boolean
          requiere_anticipo?: boolean
          salida_latitud?: number | null
          salida_longitud?: number | null
          sitio_web?: string | null
          solo_reservacion?: boolean
          tiempo_preparacion?: string | null
          tipo_servicio?: string | null
          usa_calendario?: boolean
          whatsapp_activo?: boolean
          whatsapp_numero?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocio_perfil_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: true
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_productos: {
        Row: {
          actualizado_en: string
          categoria: string | null
          creado_en: string
          descripcion: string | null
          disponible: boolean
          foto_ruta: string | null
          foto_url: string | null
          id: string
          negocio_id: string
          nombre: string
          orden: number
          precio: number
        }
        Insert: {
          actualizado_en?: string
          categoria?: string | null
          creado_en?: string
          descripcion?: string | null
          disponible?: boolean
          foto_ruta?: string | null
          foto_url?: string | null
          id?: string
          negocio_id: string
          nombre: string
          orden?: number
          precio?: number
        }
        Update: {
          actualizado_en?: string
          categoria?: string | null
          creado_en?: string
          descripcion?: string | null
          disponible?: boolean
          foto_ruta?: string | null
          foto_url?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          orden?: number
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "negocio_productos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_promociones: {
        Row: {
          activa: boolean
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          foto_public_id: string | null
          foto_url: string | null
          id: string
          negocio_id: string
          orden: number
          precio: number | null
          titulo: string
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          foto_public_id?: string | null
          foto_url?: string | null
          id?: string
          negocio_id: string
          orden?: number
          precio?: number | null
          titulo: string
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          foto_public_id?: string | null
          foto_url?: string | null
          id?: string
          negocio_id?: string
          orden?: number
          precio?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_promociones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_vehiculos: {
        Row: {
          activo: boolean
          actualizado_en: string
          aire_acondicionado: boolean
          creado_en: string
          descripcion: string | null
          equipaje: string | null
          id: string
          modelo_referencia: string | null
          negocio_id: string
          nombre: string
          orden: number
          pasajeros: number
          precio: number | null
          precio_tipo: string
          transmision: string
          unidades: number
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          aire_acondicionado?: boolean
          creado_en?: string
          descripcion?: string | null
          equipaje?: string | null
          id?: string
          modelo_referencia?: string | null
          negocio_id: string
          nombre: string
          orden?: number
          pasajeros?: number
          precio?: number | null
          precio_tipo?: string
          transmision?: string
          unidades?: number
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          aire_acondicionado?: boolean
          creado_en?: string
          descripcion?: string | null
          equipaje?: string | null
          id?: string
          modelo_referencia?: string | null
          negocio_id?: string
          nombre?: string
          orden?: number
          pasajeros?: number
          precio?: number | null
          precio_tipo?: string
          transmision?: string
          unidades?: number
        }
        Relationships: [
          {
            foreignKeyName: "negocio_vehiculos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          actualizado_en: string
          celular: string
          creado_en: string
          estado_configuracion: Database["public"]["Enums"]["negocio_config"]
          estatus: Database["public"]["Enums"]["negocio_estatus"]
          fecha_fin: string
          fecha_inicio: string
          id: string
          municipio: string
          nombre_dueno: string
          nombre_negocio: string
          owner_id: string | null
          plan_tipo: string
          tipo: string
          usuario: string
        }
        Insert: {
          actualizado_en?: string
          celular: string
          creado_en?: string
          estado_configuracion?: Database["public"]["Enums"]["negocio_config"]
          estatus?: Database["public"]["Enums"]["negocio_estatus"]
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          municipio: string
          nombre_dueno: string
          nombre_negocio: string
          owner_id?: string | null
          plan_tipo?: string
          tipo: string
          usuario: string
        }
        Update: {
          actualizado_en?: string
          celular?: string
          creado_en?: string
          estado_configuracion?: Database["public"]["Enums"]["negocio_config"]
          estatus?: Database["public"]["Enums"]["negocio_estatus"]
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          municipio?: string
          nombre_dueno?: string
          nombre_negocio?: string
          owner_id?: string | null
          plan_tipo?: string
          tipo?: string
          usuario?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          actualizado_en: string
          cliente_nombre: string
          cliente_telefono: string
          costo_entrega: number
          creado_en: string
          direccion: string | null
          estado: string
          folio: string
          forma_pago: string | null
          hora_solicitada: string | null
          id: string
          items: Json
          negocio_id: string
          origen: string
          referencia: string | null
          subtotal: number
          tipo_entrega: string
          total_estimado: number
        }
        Insert: {
          actualizado_en?: string
          cliente_nombre: string
          cliente_telefono: string
          costo_entrega?: number
          creado_en?: string
          direccion?: string | null
          estado?: string
          folio?: string
          forma_pago?: string | null
          hora_solicitada?: string | null
          id?: string
          items?: Json
          negocio_id: string
          origen?: string
          referencia?: string | null
          subtotal?: number
          tipo_entrega?: string
          total_estimado?: number
        }
        Update: {
          actualizado_en?: string
          cliente_nombre?: string
          cliente_telefono?: string
          costo_entrega?: number
          creado_en?: string
          direccion?: string | null
          estado?: string
          folio?: string
          forma_pago?: string | null
          hora_solicitada?: string | null
          id?: string
          items?: Json
          negocio_id?: string
          origen?: string
          referencia?: string | null
          subtotal?: number
          tipo_entrega?: string
          total_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          creado_en: string
          id: string
          usuario: string
        }
        Insert: {
          creado_en?: string
          id: string
          usuario: string
        }
        Update: {
          creado_en?: string
          id?: string
          usuario?: string
        }
        Relationships: []
      }
      resenas: {
        Row: {
          comentario: string | null
          creado_en: string
          estrellas: number
          id: string
          negocio_id: string
          telefono: string
        }
        Insert: {
          comentario?: string | null
          creado_en?: string
          estrellas: number
          id?: string
          negocio_id: string
          telefono: string
        }
        Update: {
          comentario?: string | null
          creado_en?: string
          estrellas?: number
          id?: string
          negocio_id?: string
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "resenas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      reservaciones: {
        Row: {
          actualizado_en: string
          cliente_nombre: string
          cliente_telefono: string
          creado_en: string
          estado: string
          experiencia_id: string | null
          experiencia_nombre: string
          extras: Json
          fecha_solicitada: string | null
          folio: string
          horario: string | null
          id: string
          negocio_id: string
          origen: string
          personas: number
          total_estimado: number | null
        }
        Insert: {
          actualizado_en?: string
          cliente_nombre: string
          cliente_telefono: string
          creado_en?: string
          estado?: string
          experiencia_id?: string | null
          experiencia_nombre: string
          extras?: Json
          fecha_solicitada?: string | null
          folio?: string
          horario?: string | null
          id?: string
          negocio_id: string
          origen?: string
          personas?: number
          total_estimado?: number | null
        }
        Update: {
          actualizado_en?: string
          cliente_nombre?: string
          cliente_telefono?: string
          creado_en?: string
          estado?: string
          experiencia_id?: string | null
          experiencia_nombre?: string
          extras?: Json
          fecha_solicitada?: string | null
          folio?: string
          horario?: string | null
          id?: string
          negocio_id?: string
          origen?: string
          personas?: number
          total_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservaciones_experiencia_id_fkey"
            columns: ["experiencia_id"]
            isOneToOne: false
            referencedRelation: "negocio_experiencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservaciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_hospedaje: {
        Row: {
          actualizado_en: string
          alojamiento_id: string | null
          alojamiento_nombre: string
          check_in: string
          check_out: string
          cliente_nombre: string
          cliente_telefono: string
          creado_en: string
          estado: string
          folio: string
          huespedes: number
          id: string
          modo_disponibilidad: string
          negocio_id: string
          noches: number
          origen: string
          precio_referencia: number | null
          total_estimado: number | null
        }
        Insert: {
          actualizado_en?: string
          alojamiento_id?: string | null
          alojamiento_nombre: string
          check_in: string
          check_out: string
          cliente_nombre: string
          cliente_telefono: string
          creado_en?: string
          estado?: string
          folio?: string
          huespedes?: number
          id?: string
          modo_disponibilidad?: string
          negocio_id: string
          noches?: number
          origen?: string
          precio_referencia?: number | null
          total_estimado?: number | null
        }
        Update: {
          actualizado_en?: string
          alojamiento_id?: string | null
          alojamiento_nombre?: string
          check_in?: string
          check_out?: string
          cliente_nombre?: string
          cliente_telefono?: string
          creado_en?: string
          estado?: string
          folio?: string
          huespedes?: number
          id?: string
          modo_disponibilidad?: string
          negocio_id?: string
          noches?: number
          origen?: string
          precio_referencia?: number | null
          total_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_hospedaje_alojamiento_id_fkey"
            columns: ["alojamiento_id"]
            isOneToOne: false
            referencedRelation: "negocio_alojamientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_hospedaje_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_renta: {
        Row: {
          actualizado_en: string
          cliente_nombre: string
          cliente_telefono: string
          costo_entrega: number | null
          creado_en: string
          dias: number
          estado: string
          fecha_fin: string
          fecha_inicio: string
          folio: string
          hora_fin: string
          hora_inicio: string
          id: string
          lugar_entrega: string
          modo_disponibilidad: string
          negocio_id: string
          origen: string
          pasajeros: number | null
          precio_referencia: number | null
          total_estimado: number | null
          vehiculo_id: string | null
          vehiculo_nombre: string
        }
        Insert: {
          actualizado_en?: string
          cliente_nombre: string
          cliente_telefono: string
          costo_entrega?: number | null
          creado_en?: string
          dias?: number
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          folio?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          lugar_entrega?: string
          modo_disponibilidad?: string
          negocio_id: string
          origen?: string
          pasajeros?: number | null
          precio_referencia?: number | null
          total_estimado?: number | null
          vehiculo_id?: string | null
          vehiculo_nombre: string
        }
        Update: {
          actualizado_en?: string
          cliente_nombre?: string
          cliente_telefono?: string
          costo_entrega?: number | null
          creado_en?: string
          dias?: number
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          folio?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          lugar_entrega?: string
          modo_disponibilidad?: string
          negocio_id?: string
          origen?: string
          pasajeros?: number | null
          precio_referencia?: number | null
          total_estimado?: number | null
          vehiculo_id?: string | null
          vehiculo_nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_renta_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_renta_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "negocio_vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_publicos: {
        Row: {
          acepta_promociones: boolean
          creado_en: string
          id: string
          telefono: string
        }
        Insert: {
          acepta_promociones?: boolean
          creado_en?: string
          id?: string
          telefono: string
        }
        Update: {
          acepta_promociones?: boolean
          creado_en?: string
          id?: string
          telefono?: string
        }
        Relationships: []
      }
      vehiculo_bloqueos: {
        Row: {
          creado_en: string
          fecha: string
          id: string
          negocio_id: string
          unidades: number
          vehiculo_id: string
        }
        Insert: {
          creado_en?: string
          fecha: string
          id?: string
          negocio_id: string
          unidades?: number
          vehiculo_id: string
        }
        Update: {
          creado_en?: string
          fecha?: string
          id?: string
          negocio_id?: string
          unidades?: number
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculo_bloqueos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_bloqueos_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "negocio_vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculo_medios: {
        Row: {
          bytes: number | null
          creado_en: string
          duration: number | null
          es_portada: boolean
          format: string | null
          id: string
          negocio_id: string
          orden: number
          public_id: string
          resource_type: string
          secure_url: string
          tipo: string
          vehiculo_id: string
        }
        Insert: {
          bytes?: number | null
          creado_en?: string
          duration?: number | null
          es_portada?: boolean
          format?: string | null
          id?: string
          negocio_id: string
          orden?: number
          public_id: string
          resource_type?: string
          secure_url: string
          tipo?: string
          vehiculo_id: string
        }
        Update: {
          bytes?: number | null
          creado_en?: string
          duration?: number | null
          es_portada?: boolean
          format?: string | null
          id?: string
          negocio_id?: string
          orden?: number
          public_id?: string
          resource_type?: string
          secure_url?: string
          tipo?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculo_medios_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_medios_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "negocio_vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "negocio"
      negocio_config: "perfil_incompleto" | "perfil_completo"
      negocio_estatus: "activo" | "suspendido"
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
    Enums: {
      app_role: ["master", "negocio"],
      negocio_config: ["perfil_incompleto", "perfil_completo"],
      negocio_estatus: ["activo", "suspendido"],
    },
  },
} as const
