/**
 * Copyright 2018-present MongoDB, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  CoreStitchAppClient,
  CoreStitchServiceClientImpl,
  StitchAppClientConfiguration,
  StitchAppClientInfo,
  StitchRequestClient
} from "mongodb-stitch-core-sdk";
import NamedServiceClientFactory from "../../services/internal/NamedServiceClientFactory";
import ServiceClientFactory from "../../services/internal/ServiceClientFactory";
import StitchAuthImpl from "../auth/internal/StitchAuthImpl";
import StitchBrowserAppRoutes from "../auth/internal/StitchBrowserAppRoutes";

import StitchAppClient from "../StitchAppClient";
import StitchServiceClient from "../../services/StitchServiceClient";
import StitchServiceClientImpl from "../../services/internal/StitchServiceClientImpl";

/** @hidden */
export default class StitchAppClientImpl implements StitchAppClient {
  public readonly auth: StitchAuthImpl;

  private readonly coreClient: CoreStitchAppClient;
  private readonly info: StitchAppClientInfo;
  private readonly routes: StitchBrowserAppRoutes;

  public constructor(
    clientAppId: string,
    config: StitchAppClientConfiguration
  ) {
    this.info = new StitchAppClientInfo(
      clientAppId,
      config.dataDirectory,
      config.localAppName,
      config.localAppVersion
    );
    this.routes = new StitchBrowserAppRoutes(
      this.info.clientAppId,
      config.baseUrl
    );
    const requestClient = new StitchRequestClient(
      config.baseUrl,
      config.transport
    );
    this.auth = new StitchAuthImpl(
      requestClient,
      this.routes.authRoutes,
      config.storage,
      this.info
    );
    this.coreClient = new CoreStitchAppClient(this.auth, this.routes);
  }

  public getServiceClient<T>(
    factory: ServiceClientFactory<T> | NamedServiceClientFactory<T>,
    serviceName?: string
  ): T {
    if (isServiceClientFactory(factory)) {
      return factory.getClient(
        new CoreStitchServiceClientImpl(this.auth, this.routes.serviceRoutes, ""),
        this.info
      );
    } else {
      return factory.getNamedClient(
        new CoreStitchServiceClientImpl(
          this.auth,
          this.routes.serviceRoutes,
          serviceName!
        ),
        this.info
      );
    }
  }

  public getGeneralServiceClient(serviceName: string): StitchServiceClient {
    return new StitchServiceClientImpl(
      new CoreStitchServiceClientImpl(
        this.auth,
        this.routes.serviceRoutes,
        serviceName
      )
    );
  }

  public callFunction(name: string, args: any[]): Promise<any> {
    return this.coreClient.callFunction(name, args);
  }
}

function isServiceClientFactory<T>(
  factory: ServiceClientFactory<T> | NamedServiceClientFactory<T>
): factory is ServiceClientFactory<T> {
  return (factory as ServiceClientFactory<T>).getClient !== undefined;
}
