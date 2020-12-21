import { ApiArgValidatable } from "../framework/api";

@ApiArgValidatable({
    validator: v => true,
})
export class MyType {

}