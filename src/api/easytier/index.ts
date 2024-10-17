import request from '@/axios'
import { CORE_INFO_API } from '@/constants/easytier'

export const getGithubVer = async () => {
  return request.get<GithubVer>({ url: CORE_INFO_API })
}
