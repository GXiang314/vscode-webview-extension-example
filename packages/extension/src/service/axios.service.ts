import { service } from 'cec-client-server/decorator'
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig
} from 'axios'

@service()
export class AxiosService
  implements Pick<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'>
{
  private readonly axiosInstance: AxiosInstance
  private readonly createAxiosDefaults: CreateAxiosDefaults = {}
  private readonly requestInterceptor = {
    onFulfilled: (config: InternalAxiosRequestConfig) => {
      return config
    },
    onRejected: (error: any) => {
      return Promise.reject(error)
    }
  }
  private readonly responseInterceptor = {
    onFulfilled: (config: AxiosResponse) => {
      return config
    },
    onRejected: (error: any) => {
      return Promise.reject(error)
    }
  }

  constructor() {
    this.axiosInstance = axios.create(this.createAxiosDefaults)
    const { onFulfilled, onRejected } = this.requestInterceptor
    this.axiosInstance.interceptors.request.use(onFulfilled, onRejected)
    const { onFulfilled: onFulfilled01, onRejected: onRejected01 } = this.responseInterceptor
    this.axiosInstance.interceptors.response.use(onFulfilled01, onRejected01)
  }

  get<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.get(url, config)
  }

  post<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, data, config)
  }

  put<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, data, config)
  }

  delete<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, config)
  }

  patch<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, data, config)
  }
}
