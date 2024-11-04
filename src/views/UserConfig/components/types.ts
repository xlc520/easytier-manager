interface NetworkIdentity {
  network_name: string
  network_secret: string
}

interface Peer {
  uri: string
}

interface ProxyNetwork {
  cidr: string
}

interface ConsoleLogger {
  level: string
}

interface FileLogger {
  level?: string | undefined
  file?: string | undefined
  dir?: string | undefined
}

interface Flags {
  default_protocol: string
  dev_name: string
  disable_encryption: boolean
  disable_ipv6: boolean
  latency_first: boolean
  enable_exit_node: boolean
  no_tun: boolean
  use_smoltcp: boolean
  disable_p2p: boolean
  disable_udp_hole_punching: boolean
  multi_thread: boolean
  relay_all_peer_rpc: boolean
  manual_routes: string | undefined
  ipv6_listener: string
  socks5?: string | undefined
  relay_network_whitelist?: string | undefined
}

interface FormData {
  hostname?: string | undefined
  instance_name?: string | undefined
  network_identity: Partial<NetworkIdentity>
  dhcp?: boolean | undefined
  ipv4?: string | undefined
  peer: Partial<Peer>[] | undefined | null
  listeners: any[]
  proxy_network: Partial<ProxyNetwork>[] | undefined | null
  exit_nodes: any[] | undefined
  rpc_portal: string
  console_logger: Partial<ConsoleLogger> | any
  file_logger: Partial<FileLogger>
  flags: Partial<Flags>
}
