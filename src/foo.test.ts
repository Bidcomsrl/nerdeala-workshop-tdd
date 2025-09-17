import {Foo} from "@/Foo";

describe("foo", ()=>{
    it("should pass", ()=>{
        const foo = new Foo();

        const bar = foo.bar();

        expect(bar).toEqual(true);
    })
})