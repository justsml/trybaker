//@flow
import BaseProvider from './providers/baseProvider.mjs';
import PostGresProvider from './providers/postgresProvider.mjs';
import SendgridProvider from './providers/sendgridProvider.mjs';
import TwilioProvider from './providers/twilioProvider.mjs';
import SwaggerProvider from "./providers/swaggerProvider.mjs";

export class DataProvider {
    get:(provider:string) => *;
    constructor(services:Map<string, $Subtype<BaseProvider>>) {
        this.get = (serviceName:string) => services.get(serviceName);
    }
}

const initServices = (servicesToInit:Map<string, $Subtype<BaseProvider>>) => {


    const serviceList: Array<$Subtype<BaseProvider>> = [];

    const installService = x => {
        if(!x) {return;}
        serviceList.push(x)
    }
    // We need to convert the input map into a promise array of init'd services
    // however we still need the keys to 'install' the provider
    Array.from(servicesToInit.keys())
        .map(k => installService(servicesToInit.get(k)))

    const result:Promise<DataProvider> = Promise.all(serviceList)
        .then(results => {
            console.log('...data services init complete');

            const services = new Map();
            results.map((x:{key:string, service:*}) => services.set(x.key, x.service));

            return services;
        }).then(x => new DataProvider(x));

    return result;
}

const init = () => {
    console.log('Initializing data services');
    const servicesToInit: Map<string, $Subtype<BaseProvider>> = new Map();
    const installProvider = (provider: $Subtype<BaseProvider>) => {
        servicesToInit.set(provider.key, provider);
    }

    installProvider(new PostGresProvider());
    installProvider(new SendgridProvider());
    installProvider(new SwaggerProvider());
    installProvider(new TwilioProvider());

    return initServices(servicesToInit);
}

export default {init}