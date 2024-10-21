import { reactive } from 'vue'
import { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { useI18n } from '@/hooks/web/useI18n'

const { t } = useI18n()
const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'index',
    label: t('userDemo.index'),
    form: {
      hidden: true
    },
    search: {
      hidden: true
    },
    detail: {
      hidden: true
    },
    table: {
      type: 'index'
    }
  },
  {
    field: 'id',
    label: t('easytier.id'),
    search: {
      hidden: true
    },
    table: {
      hidden: true
    }
  },
  {
    field: 'ipv4',
    label: t('easytier.ipv4Vir'),
    width: 100
  },
  // {
  //   field: 'ipv4Local',
  //   label: t('easytier.ipv4Local')
  // },
  {
    field: 'hostname',
    label: t('easytier.hostname'),
    showOverflowTooltip: true
  },
  {
    field: 'cost',
    label: t('easytier.cost'),
    search: {
      hidden: true
    }
  },
  {
    field: 'rx_bytes',
    label: t('easytier.rx_bytes'),
    search: {
      hidden: true
    }
  },
  {
    field: 'tx_bytes',
    label: t('easytier.tx_bytes'),
    search: {
      hidden: true
    }
  },
  {
    field: 'lat_ms',
    label: t('easytier.lat_ms'),
    search: {
      hidden: true
    }
  },
  {
    field: 'loss_rate',
    label: t('easytier.loss_rate'),
    search: {
      hidden: true
    }
  },
  {
    field: 'nat_type',
    label: t('easytier.nat_type'),
    search: {
      hidden: true
    }
  },
  {
    field: 'version',
    label: t('easytier.version'),
    search: {
      hidden: true
    }
  },
  {
    field: 'tunnel_proto',
    label: t('easytier.tunnel_proto'),
    search: {
      hidden: true
    },
    table: {
      hidden: false
    }
  }
])

export default crudSchemas
