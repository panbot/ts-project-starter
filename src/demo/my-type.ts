import { ApiArgValidatable } from "../core/api";

@ApiArgValidatable({
    validator: v => true,
})
export class MyType {

}