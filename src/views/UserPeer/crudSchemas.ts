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
    label: t('easyTire.id'),
    search: {
      hidden: true
    },
    table: {
      hidden: true
    }
  },
  {
    field: 'ipv4',
    label: t('easyTire.ipv4Vir'),
    width: 100
  },
  // {
  //   field: 'ipv4Local',
  //   label: t('easyTire.ipv4Local')
  // },
  {
    field: 'hostname',
    label: t('easyTire.hostname'),
    showOverflowTooltip: true
  },
  {
    field: 'cost',
    label: t('easyTire.cost'),
    search: {
      hidden: true
    }
  },
  {
    field: 'lat_ms',
    label: t('easyTire.lat_ms'),
    search: {
      hidden: true
    }
  },
  {
    field: 'loss_rate',
    label: t('easyTire.loss_rate'),
    search: {
      hidden: true
    }
  },
  {
    field: 'rx_bytes',
    label: t('easyTire.rx_bytes'),
    search: {
      hidden: true
    }
  },
  {
    field: 'tx_bytes',
    label: t('easyTire.tx_bytes'),
    search: {
      hidden: true
    }
  },
  {
    field: 'tunnel_proto',
    label: t('easyTire.tunnel_proto'),
    search: {
      hidden: true
    },
    table: {
      hidden: true
    }
  },
  {
    field: 'nat_type',
    label: t('easyTire.nat_type'),
    search: {
      hidden: true
    }
  },
  {
    field: 'version',
    label: t('easyTire.version'),
    search: {
      hidden: true
    }
  }
])

export default crudSchemas
