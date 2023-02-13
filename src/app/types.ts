import { FastifyReply, FastifyRequest } from "fastify";
import { RouteContextGeneric } from "../lib/framework/types";
import { UserContext } from "./security";

export type RouteContext = RouteContextGeneric<FastifyRequest, FastifyReply, UserContext>;
