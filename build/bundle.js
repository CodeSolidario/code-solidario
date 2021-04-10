
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.36.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\home-page\Header.svelte generated by Svelte v3.36.0 */

    const file$7 = "src\\home-page\\Header.svelte";

    function create_fragment$7(ctx) {
    	let nav;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let button;
    	let span;
    	let t1;
    	let div;
    	let ul;
    	let li0;
    	let a1;
    	let t3;
    	let li1;
    	let a2;
    	let t5;
    	let li2;
    	let a3;
    	let t7;
    	let li3;
    	let a4;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			button = element("button");
    			span = element("span");
    			t1 = space();
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "HOME";
    			t3 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "PROJETOS";
    			t5 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "SOBRE";
    			t7 = space();
    			li3 = element("li");
    			a4 = element("a");
    			a4.textContent = "CONTATO";
    			if (img.src !== (img_src_value = "images/logo-1.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo code solidário");
    			add_location(img, file$7, 1, 35, 106);
    			attr_dev(a0, "class", "navbar-brand");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$7, 1, 2, 73);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$7, 11, 4, 406);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarTogglerDemo01");
    			attr_dev(button, "aria-controls", "navbarTogglerDemo01");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$7, 2, 2, 169);
    			attr_dev(a1, "class", "nav-link svelte-19xhj9z");
    			attr_dev(a1, "href", "#home");
    			add_location(a1, file$7, 16, 8, 611);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file$7, 15, 6, 580);
    			attr_dev(a2, "class", "nav-link svelte-19xhj9z");
    			attr_dev(a2, "href", "#projetos");
    			add_location(a2, file$7, 19, 8, 704);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$7, 18, 6, 673);
    			attr_dev(a3, "class", "nav-link svelte-19xhj9z");
    			attr_dev(a3, "href", "#sobre");
    			add_location(a3, file$7, 22, 8, 805);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$7, 21, 6, 774);
    			attr_dev(a4, "class", "nav-link svelte-19xhj9z");
    			attr_dev(a4, "href", "#contato");
    			add_location(a4, file$7, 28, 8, 1002);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$7, 27, 6, 971);
    			attr_dev(ul, "class", "navbar-nav mr-auto mt-2 mt-lg-0 svelte-19xhj9z");
    			add_location(ul, file$7, 14, 4, 528);
    			attr_dev(div, "class", "collapse navbar-collapse");
    			attr_dev(div, "id", "navbarTogglerDemo01");
    			add_location(div, file$7, 13, 2, 459);
    			attr_dev(nav, "class", "navbar fixed-top navbar-expand-lg navbar-light bg-light");
    			add_location(nav, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a0);
    			append_dev(a0, img);
    			append_dev(nav, t0);
    			append_dev(nav, button);
    			append_dev(button, span);
    			append_dev(nav, t1);
    			append_dev(nav, div);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			append_dev(ul, t7);
    			append_dev(ul, li3);
    			append_dev(li3, a4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\content\Banner.svelte generated by Svelte v3.36.0 */

    const file$6 = "src\\content\\Banner.svelte";

    function create_fragment$6(ctx) {
    	let figure;
    	let div5;
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let h1;
    	let t2;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			figure = element("figure");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Encontre projetos de interesse social para colaborar e utilize a tecnologia para ajudar pessoas.";
    			t2 = space();
    			img = element("img");
    			attr_dev(div0, "class", "layer svelte-ah3s6d");
    			add_location(div0, file$6, 8, 8, 207);
    			attr_dev(h1, "class", "svelte-ah3s6d");
    			add_location(h1, file$6, 11, 12, 353);
    			attr_dev(div1, "class", "col-12");
    			set_style(div1, "padding-top", "30%");
    			set_style(div1, "padding-bottom", "20%");
    			add_location(div1, file$6, 10, 10, 273);
    			attr_dev(div2, "class", "row texto svelte-ah3s6d");
    			add_location(div2, file$6, 9, 8, 238);
    			attr_dev(img, "class", "d-block w-100");
    			if (img.src !== (img_src_value = "images/bg-01.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "First slide");
    			add_location(img, file$6, 16, 8, 532);
    			attr_dev(div3, "class", "carousel-item active");
    			add_location(div3, file$6, 7, 6, 163);
    			attr_dev(div4, "class", "carousel-inner");
    			add_location(div4, file$6, 6, 4, 127);
    			attr_dev(div5, "id", "carouselExampleSlidesOnly");
    			attr_dev(div5, "class", "carousel slide");
    			attr_dev(div5, "data-ride", "carousel");
    			add_location(div5, file$6, 1, 2, 22);
    			attr_dev(figure, "id", "home");
    			attr_dev(figure, "class", "svelte-ah3s6d");
    			add_location(figure, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, figure, anchor);
    			append_dev(figure, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div3, t2);
    			append_dev(div3, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(figure);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Banner", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Banner> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Banner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Banner",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios$1 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$1.Axios = Axios_1;

    // Factory for creating new instances
    axios$1.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios$1.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios$1.Cancel = Cancel_1;
    axios$1.CancelToken = CancelToken_1;
    axios$1.isCancel = isCancel;

    // Expose all/spread
    axios$1.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$1.spread = spread;

    // Expose isAxiosError
    axios$1.isAxiosError = isAxiosError;

    var axios_1 = axios$1;

    // Allow use of default import syntax in TypeScript
    var _default = axios$1;
    axios_1.default = _default;

    var axios = axios_1;

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const initialState = {
        repositories: []
    };

    const pagination = writable({
        page: 1,
        totalPages: 1,
        totalCount: 1,
        totalPerPage: 12
    });

    const topics = writable([
        {name:"emprego"}, {name: "ambiental"}, {name:"educacao"}, {name:"seguranca"}, {name:"saude"}, {name: "saneamento"}, {name:"animais"}
    ]);

    const repositoryStore = writable(initialState);

    /* src\content\Projects.svelte generated by Svelte v3.36.0 */

    const { Error: Error_1, console: console_1 } = globals;

    const file$5 = "src\\content\\Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (93:6) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[11].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$5, 93, 8, 2885);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise*/ 4 && t_value !== (t_value = /*error*/ ctx[11].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(93:6) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (75:6) {:then}
    function create_then_block(ctx) {
    	let div;
    	let each_value = /*repositories*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "row");
    			add_location(div, file$5, 75, 8, 2180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*repositories*/ 1) {
    				each_value = /*repositories*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(75:6) {:then}",
    		ctx
    	});

    	return block;
    }

    // (77:10) {#each repositories as repo}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let h5;
    	let a;
    	let t0_value = /*repo*/ ctx[8].name + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let h6;
    	let t2_value = /*repo*/ ctx[8].language + "";
    	let t2;
    	let t3;
    	let p;

    	let t4_value = (/*repo*/ ctx[8].description
    	? /*repo*/ ctx[8].description.substring(0, 100)
    	: "") + "";

    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			h6 = element("h6");
    			t2 = text(t2_value);
    			t3 = space();
    			p = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(a, "href", a_href_value = /*repo*/ ctx[8].html_url);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "card-link svelte-1m1vwvu");
    			add_location(a, file$5, 80, 18, 2417);
    			attr_dev(h5, "class", "card-title");
    			add_location(h5, file$5, 79, 16, 2374);
    			attr_dev(h6, "class", "card-subtitle mb-2 text-muted");
    			add_location(h6, file$5, 84, 16, 2573);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$5, 85, 16, 2653);
    			attr_dev(div0, "class", "card-body");
    			add_location(div0, file$5, 78, 14, 2333);
    			attr_dev(div1, "class", "card col-lg-4 col-md-6 col-sm12");
    			set_style(div1, "border", "none");
    			add_location(div1, file$5, 77, 12, 2251);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h5);
    			append_dev(h5, a);
    			append_dev(a, t0);
    			append_dev(div0, t1);
    			append_dev(div0, h6);
    			append_dev(h6, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p);
    			append_dev(p, t4);
    			append_dev(div1, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*repositories*/ 1 && t0_value !== (t0_value = /*repo*/ ctx[8].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*repositories*/ 1 && a_href_value !== (a_href_value = /*repo*/ ctx[8].html_url)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*repositories*/ 1 && t2_value !== (t2_value = /*repo*/ ctx[8].language + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*repositories*/ 1 && t4_value !== (t4_value = (/*repo*/ ctx[8].description
    			? /*repo*/ ctx[8].description.substring(0, 100)
    			: "") + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(77:10) {#each repositories as repo}",
    		ctx
    	});

    	return block;
    }

    // (73:22)           <p>...waiting</p>        {:then}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "...waiting";
    			add_location(p, file$5, 73, 8, 2138);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(73:22)           <p>...waiting</p>        {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let div5;
    	let h2;
    	let t1;
    	let div3;
    	let div2;
    	let div1;
    	let input;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let div4;
    	let promise_1;
    	let t5;
    	let nav;
    	let ul;
    	let li0;
    	let button1;
    	let span0;
    	let t7;
    	let span1;
    	let button1_disabled_value;
    	let t9;
    	let li1;
    	let button2;
    	let span2;
    	let t11;
    	let span3;
    	let button2_disabled_value;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		error: 11
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[2], info);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div5 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Projetos";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Buscar";
    			t4 = space();
    			div4 = element("div");
    			info.block.c();
    			t5 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			button1 = element("button");
    			span0 = element("span");
    			span0.textContent = "«";
    			t7 = space();
    			span1 = element("span");
    			span1.textContent = "Previous";
    			t9 = space();
    			li1 = element("li");
    			button2 = element("button");
    			span2 = element("span");
    			span2.textContent = "»";
    			t11 = space();
    			span3 = element("span");
    			span3.textContent = "Next";
    			add_location(h2, file$5, 49, 4, 1438);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Problema social - Ex: desemprego");
    			attr_dev(input, "aria-label", "Recipient's username");
    			attr_dev(input, "aria-describedby", "basic-addon2");
    			add_location(input, file$5, 53, 10, 1553);
    			attr_dev(button0, "class", "btn btn-success");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$5, 62, 12, 1875);
    			attr_dev(div0, "class", "input-group-append");
    			add_location(div0, file$5, 61, 10, 1829);
    			attr_dev(div1, "class", "input-group");
    			add_location(div1, file$5, 52, 8, 1516);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$5, 51, 6, 1489);
    			attr_dev(div3, "class", "select");
    			add_location(div3, file$5, 50, 4, 1461);
    			attr_dev(div4, "class", "repos");
    			add_location(div4, file$5, 71, 4, 2085);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file$5, 105, 12, 3310);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$5, 106, 12, 3363);
    			attr_dev(button1, "class", "page-link");
    			attr_dev(button1, "aria-label", "Previous");
    			button1.disabled = button1_disabled_value = /*$pagination*/ ctx[3].page <= 1;
    			add_location(button1, file$5, 99, 10, 3100);
    			attr_dev(li0, "class", "page-item");
    			add_location(li0, file$5, 98, 8, 3066);
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file$5, 116, 12, 3707);
    			attr_dev(span3, "class", "sr-only");
    			add_location(span3, file$5, 117, 12, 3760);
    			attr_dev(button2, "class", "page-link");
    			attr_dev(button2, "aria-label", "Next");
    			button2.disabled = button2_disabled_value = /*$pagination*/ ctx[3].page >= /*$pagination*/ ctx[3].totalPages;
    			add_location(button2, file$5, 110, 10, 3480);
    			attr_dev(li1, "class", "page-item");
    			add_location(li1, file$5, 109, 8, 3446);
    			attr_dev(ul, "class", "pagination justify-content-center");
    			add_location(ul, file$5, 97, 6, 3010);
    			attr_dev(nav, "aria-label", "Page navigation example");
    			add_location(nav, file$5, 96, 4, 2960);
    			attr_dev(div5, "class", "content");
    			add_location(div5, file$5, 48, 2, 1411);
    			attr_dev(section, "id", "projetos");
    			attr_dev(section, "class", "svelte-1m1vwvu");
    			add_location(section, file$5, 47, 0, 1384);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div5);
    			append_dev(div5, h2);
    			append_dev(div5, t1);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*filter*/ ctx[1]);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			info.block.m(div4, info.anchor = null);
    			info.mount = () => div4;
    			info.anchor = null;
    			append_dev(div5, t5);
    			append_dev(div5, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button1);
    			append_dev(button1, span0);
    			append_dev(button1, t7);
    			append_dev(button1, span1);
    			append_dev(ul, t9);
    			append_dev(ul, li1);
    			append_dev(li1, button2);
    			append_dev(button2, span2);
    			append_dev(button2, t11);
    			append_dev(button2, span3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(button0, "click", /*handleSelect*/ ctx[4], false, false, false),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function((/*$pagination*/ ctx[3].page -= 1, /*handleSelect*/ ctx[4]))) (/*$pagination*/ ctx[3].page -= 1, /*handleSelect*/ ctx[4]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function((/*$pagination*/ ctx[3].page += 1, /*handleSelect*/ ctx[4]))) (/*$pagination*/ ctx[3].page += 1, /*handleSelect*/ ctx[4]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*filter*/ 2 && input.value !== /*filter*/ ctx[1]) {
    				set_input_value(input, /*filter*/ ctx[1]);
    			}

    			info.ctx = ctx;

    			if (dirty & /*promise*/ 4 && promise_1 !== (promise_1 = /*promise*/ ctx[2]) && handle_promise(promise_1, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[11] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (dirty & /*$pagination*/ 8 && button1_disabled_value !== (button1_disabled_value = /*$pagination*/ ctx[3].page <= 1)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*$pagination*/ 8 && button2_disabled_value !== (button2_disabled_value = /*$pagination*/ ctx[3].page >= /*$pagination*/ ctx[3].totalPages)) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $pagination;
    	validate_store(pagination, "pagination");
    	component_subscribe($$self, pagination, $$value => $$invalidate(3, $pagination = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Projects", slots, []);
    	let repositories = [];
    	repositoryStore.subscribe(_ => $$invalidate(0, repositories = _.repositories));
    	const resetRepo = () => repositoryStore.set({ ...initialState });
    	let filter = "";

    	const fetchRepo = async () => {
    		let searchUrl = `https://api.github.com/search/repositories?q=topic:open-source+topic:interesse-social`;

    		if (filter) {
    			searchUrl += `+topic:${filter}`;
    		}

    		searchUrl += `&type=Repositories&ref=searchresults&page=${$pagination.page}&per_page=${$pagination.totalPerPage}`;

    		try {
    			const repositories = await axios.get(searchUrl).then(response => {
    				set_store_value(pagination, $pagination.totalCount = response.data.total_count, $pagination);
    				set_store_value(pagination, $pagination.totalPages = Math.ceil($pagination.totalCount / $pagination.totalPerPage), $pagination);
    				return response.data.items;
    			}).catch(err => {
    				throw new Error(err);
    			});

    			repositoryStore.set({ ...initialState, repositories });
    			console.log($pagination);
    			return repositories;
    		} catch(error) {
    			resetRepo();
    		}
    	};

    	let promise = fetchRepo();

    	function handleSelect() {
    		$$invalidate(2, promise = fetchRepo());
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		filter = this.value;
    		$$invalidate(1, filter);
    	}

    	$$self.$capture_state = () => ({
    		axios,
    		repositoryStore,
    		initialState,
    		topics,
    		pagination,
    		repositories,
    		resetRepo,
    		filter,
    		fetchRepo,
    		promise,
    		handleSelect,
    		$pagination
    	});

    	$$self.$inject_state = $$props => {
    		if ("repositories" in $$props) $$invalidate(0, repositories = $$props.repositories);
    		if ("filter" in $$props) $$invalidate(1, filter = $$props.filter);
    		if ("promise" in $$props) $$invalidate(2, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [repositories, filter, promise, $pagination, handleSelect, input_input_handler];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\content\About.svelte generated by Svelte v3.36.0 */

    const file$4 = "src\\content\\About.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let h2;
    	let t1;
    	let div4;
    	let div1;
    	let div0;
    	let p0;
    	let t3;
    	let div3;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let div9;
    	let div6;
    	let div5;
    	let p1;
    	let t6;
    	let div8;
    	let div7;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			h2.textContent = "Como funciona";
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Para que seu repositório apareça em nossa página basta incluir as tags: \"open-source\" e \"interesse-social\" no repositório.";
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			img0 = element("img");
    			t4 = space();
    			div9 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			p1 = element("p");
    			p1.textContent = "Para facilitar a consulta, você pode opcionalmente incluir um tag com o tipo de problema social que está tentando solucionar.";
    			t6 = space();
    			div8 = element("div");
    			div7 = element("div");
    			img1 = element("img");
    			add_location(h2, file$4, 1, 2, 24);
    			attr_dev(p0, "class", "svelte-k0vwp2");
    			add_location(p0, file$4, 4, 25, 132);
    			attr_dev(div0, "class", "texto svelte-k0vwp2");
    			add_location(div0, file$4, 4, 6, 113);
    			attr_dev(div1, "class", "col-lg-6 col-sm-12");
    			add_location(div1, file$4, 3, 4, 73);
    			attr_dev(img0, "class", "img-fluid svelte-k0vwp2");
    			if (img0.src !== (img0_src_value = "images/como-funciona-1.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Responsive");
    			add_location(img0, file$4, 8, 8, 354);
    			attr_dev(div2, "class", "texto svelte-k0vwp2");
    			add_location(div2, file$4, 7, 6, 325);
    			attr_dev(div3, "class", "col-lg-6 col-sm-12");
    			add_location(div3, file$4, 6, 4, 285);
    			attr_dev(div4, "class", "row svelte-k0vwp2");
    			add_location(div4, file$4, 2, 2, 50);
    			attr_dev(p1, "class", "svelte-k0vwp2");
    			add_location(p1, file$4, 18, 25, 593);
    			attr_dev(div5, "class", "texto svelte-k0vwp2");
    			add_location(div5, file$4, 18, 6, 574);
    			attr_dev(div6, "class", "col-lg-6 col-sm-12");
    			add_location(div6, file$4, 17, 4, 534);
    			attr_dev(img1, "class", "img-fluid svelte-k0vwp2");
    			if (img1.src !== (img1_src_value = "images/como-funciona-2.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Responsive");
    			add_location(img1, file$4, 22, 8, 818);
    			attr_dev(div7, "class", "texto svelte-k0vwp2");
    			add_location(div7, file$4, 21, 6, 789);
    			attr_dev(div8, "class", "col-lg-6 col-sm-12");
    			add_location(div8, file$4, 20, 4, 749);
    			attr_dev(div9, "class", "row svelte-k0vwp2");
    			add_location(div9, file$4, 16, 2, 511);
    			attr_dev(section, "id", "sobre");
    			attr_dev(section, "class", "svelte-k0vwp2");
    			add_location(section, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(section, t1);
    			append_dev(section, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, img0);
    			append_dev(section, t4);
    			append_dev(section, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div5);
    			append_dev(div5, p1);
    			append_dev(div9, t6);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, img1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\content\Contact.svelte generated by Svelte v3.36.0 */

    const file$3 = "src\\content\\Contact.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let div7;
    	let div6;
    	let div5;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let form;
    	let span0;
    	let t2;
    	let div1;
    	let input0;
    	let t3;
    	let span1;
    	let t4;
    	let span2;
    	let i0;
    	let t5;
    	let div2;
    	let input1;
    	let t6;
    	let span3;
    	let t7;
    	let span4;
    	let i1;
    	let t8;
    	let div3;
    	let textarea;
    	let t9;
    	let span5;
    	let t10;
    	let div4;
    	let button;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			form = element("form");
    			span0 = element("span");
    			span0.textContent = "Entre em contato";
    			t2 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t3 = space();
    			span1 = element("span");
    			t4 = space();
    			span2 = element("span");
    			i0 = element("i");
    			t5 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t6 = space();
    			span3 = element("span");
    			t7 = space();
    			span4 = element("span");
    			i1 = element("i");
    			t8 = space();
    			div3 = element("div");
    			textarea = element("textarea");
    			t9 = space();
    			span5 = element("span");
    			t10 = space();
    			div4 = element("div");
    			button = element("button");
    			button.textContent = "Enviar";
    			if (img.src !== (img_src_value = "images/img-01.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "IMG");
    			add_location(img, file$3, 5, 5, 237);
    			attr_dev(div0, "class", "contact100-pic js-tilt");
    			attr_dev(div0, "data-tilt", "");
    			add_location(div0, file$3, 4, 4, 184);
    			attr_dev(span0, "class", "contact100-form-title");
    			add_location(span0, file$3, 8, 5, 400);
    			attr_dev(input0, "class", "input100");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "placeholder", "Nome");
    			add_location(input0, file$3, 13, 6, 568);
    			attr_dev(span1, "class", "focus-input100");
    			add_location(span1, file$3, 14, 6, 643);
    			attr_dev(i0, "class", "fa fa-user");
    			attr_dev(i0, "aria-hidden", "true");
    			add_location(i0, file$3, 16, 7, 726);
    			attr_dev(span2, "class", "symbol-input100");
    			add_location(span2, file$3, 15, 6, 687);
    			attr_dev(div1, "class", "wrap-input100 validate-input");
    			attr_dev(div1, "data-validate", "Name is required");
    			add_location(div1, file$3, 12, 5, 483);
    			attr_dev(input1, "class", "input100");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "email");
    			attr_dev(input1, "placeholder", "Email");
    			add_location(input1, file$3, 21, 6, 912);
    			attr_dev(span3, "class", "focus-input100");
    			add_location(span3, file$3, 22, 6, 989);
    			attr_dev(i1, "class", "fa fa-envelope");
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file$3, 24, 7, 1072);
    			attr_dev(span4, "class", "symbol-input100");
    			add_location(span4, file$3, 23, 6, 1033);
    			attr_dev(div2, "class", "wrap-input100 validate-input");
    			attr_dev(div2, "data-validate", "Valid email is required: ex@abc.xyz");
    			add_location(div2, file$3, 20, 5, 808);
    			attr_dev(textarea, "class", "input100");
    			attr_dev(textarea, "name", "message");
    			attr_dev(textarea, "placeholder", "Menssagem");
    			add_location(textarea, file$3, 29, 6, 1246);
    			attr_dev(span5, "class", "focus-input100");
    			add_location(span5, file$3, 30, 6, 1331);
    			attr_dev(div3, "class", "wrap-input100 validate-input");
    			attr_dev(div3, "data-validate", "Message is required");
    			add_location(div3, file$3, 28, 5, 1158);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "contact100-form-btn");
    			add_location(button, file$3, 34, 6, 1440);
    			attr_dev(div4, "class", "container-contact100-form-btn");
    			add_location(div4, file$3, 33, 5, 1389);
    			attr_dev(form, "action", "https://formspree.io/f/mgerevbb");
    			attr_dev(form, "method", "POST");
    			attr_dev(form, "class", "contact100-form validate-form");
    			add_location(form, file$3, 7, 4, 294);
    			attr_dev(div5, "class", "wrap-contact100");
    			add_location(div5, file$3, 3, 3, 149);
    			attr_dev(div6, "class", "container-contact100");
    			add_location(div6, file$3, 2, 2, 110);
    			attr_dev(div7, "class", "bg-contact100");
    			set_style(div7, "background-image", "url('images/bg-01.jpg')");
    			add_location(div7, file$3, 1, 4, 28);
    			attr_dev(section, "id", "contato");
    			add_location(section, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, img);
    			append_dev(div5, t0);
    			append_dev(div5, form);
    			append_dev(form, span0);
    			append_dev(form, t2);
    			append_dev(form, div1);
    			append_dev(div1, input0);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, span2);
    			append_dev(span2, i0);
    			append_dev(form, t5);
    			append_dev(form, div2);
    			append_dev(div2, input1);
    			append_dev(div2, t6);
    			append_dev(div2, span3);
    			append_dev(div2, t7);
    			append_dev(div2, span4);
    			append_dev(span4, i1);
    			append_dev(form, t8);
    			append_dev(form, div3);
    			append_dev(div3, textarea);
    			append_dev(div3, t9);
    			append_dev(div3, span5);
    			append_dev(form, t10);
    			append_dev(form, div4);
    			append_dev(div4, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\home-page\Content.svelte generated by Svelte v3.36.0 */
    const file$2 = "src\\home-page\\Content.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let banner;
    	let t0;
    	let projects;
    	let t1;
    	let about;
    	let t2;
    	let contact;
    	let current;
    	banner = new Banner({ $$inline: true });
    	projects = new Projects({ $$inline: true });
    	about = new About({ $$inline: true });
    	contact = new Contact({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(banner.$$.fragment);
    			t0 = space();
    			create_component(projects.$$.fragment);
    			t1 = space();
    			create_component(about.$$.fragment);
    			t2 = space();
    			create_component(contact.$$.fragment);
    			add_location(main, file$2, 8, 2, 289);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(banner, main, null);
    			append_dev(main, t0);
    			mount_component(projects, main, null);
    			append_dev(main, t1);
    			mount_component(about, main, null);
    			append_dev(main, t2);
    			mount_component(contact, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(banner.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(banner.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(banner);
    			destroy_component(projects);
    			destroy_component(about);
    			destroy_component(contact);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Content", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Content> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Banner, Projects, About, Contact });
    	return [];
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Content",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\home-page\Footer.svelte generated by Svelte v3.36.0 */

    const file$1 = "src\\home-page\\Footer.svelte";

    function create_fragment$1(ctx) {
    	let div6;
    	let p0;
    	let button;
    	let a0;
    	let t0;
    	let div5;
    	let div0;
    	let span0;
    	let a1;
    	let i0;
    	let t1;
    	let div1;
    	let span1;
    	let a2;
    	let i1;
    	let t2;
    	let div2;
    	let span2;
    	let a3;
    	let i2;
    	let t3;
    	let div4;
    	let div3;
    	let p1;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			p0 = element("p");
    			button = element("button");
    			a0 = element("a");
    			t0 = space();
    			div5 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			a1 = element("a");
    			i0 = element("i");
    			t1 = space();
    			div1 = element("div");
    			span1 = element("span");
    			a2 = element("a");
    			i1 = element("i");
    			t2 = space();
    			div2 = element("div");
    			span2 = element("span");
    			a3 = element("a");
    			i2 = element("i");
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			p1 = element("p");
    			p1.textContent = "© Made by Code Solidário";
    			attr_dev(a0, "href", "#home");
    			attr_dev(a0, "class", "btn-scroll svelte-1ouinqk");
    			add_location(a0, file$1, 4, 12, 122);
    			add_location(button, file$1, 4, 4, 114);
    			add_location(p0, file$1, 2, 2, 56);
    			attr_dev(i0, "class", "fa fa-github-alt");
    			attr_dev(i0, "aria-hidden", "true");
    			add_location(i0, file$1, 8, 86, 310);
    			attr_dev(a1, "href", "https://github.com/CodeSolidario/code-solidario");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-1ouinqk");
    			add_location(a1, file$1, 8, 12, 236);
    			add_location(span0, file$1, 8, 6, 230);
    			attr_dev(div0, "class", "col-3");
    			add_location(div0, file$1, 7, 4, 203);
    			attr_dev(i1, "class", "fa fa-facebook-square");
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file$1, 11, 77, 488);
    			attr_dev(a2, "href", "https://www.facebook.com/codesolidario");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "svelte-1ouinqk");
    			add_location(a2, file$1, 11, 12, 423);
    			add_location(span1, file$1, 11, 6, 417);
    			attr_dev(div1, "class", "col-3");
    			add_location(div1, file$1, 10, 4, 390);
    			attr_dev(i2, "class", "fa fa-linkedin-square");
    			attr_dev(i2, "aria-hidden", "true");
    			add_location(i2, file$1, 14, 92, 686);
    			attr_dev(a3, "href", "https://www.linkedin.com/company/code-solid%C3%A1rio/");
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "class", "svelte-1ouinqk");
    			add_location(a3, file$1, 14, 12, 606);
    			add_location(span2, file$1, 14, 6, 600);
    			attr_dev(div2, "class", "col-3");
    			add_location(div2, file$1, 13, 4, 573);
    			add_location(p1, file$1, 18, 8, 826);
    			attr_dev(div3, "class", "col-12");
    			add_location(div3, file$1, 17, 6, 796);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$1, 16, 4, 771);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$1, 6, 2, 180);
    			attr_dev(div6, "id", "footer");
    			attr_dev(div6, "class", "svelte-1ouinqk");
    			add_location(div6, file$1, 1, 0, 35);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, p0);
    			append_dev(p0, button);
    			append_dev(button, a0);
    			append_dev(div6, t0);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, span0);
    			append_dev(span0, a1);
    			append_dev(a1, i0);
    			append_dev(div5, t1);
    			append_dev(div5, div1);
    			append_dev(div1, span1);
    			append_dev(span1, a2);
    			append_dev(a2, i1);
    			append_dev(div5, t2);
    			append_dev(div5, div2);
    			append_dev(div2, span2);
    			append_dev(span2, a3);
    			append_dev(a3, i2);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, p1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.36.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let meta0;
    	let meta1;
    	let link;
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let script2;
    	let script2_src_value;
    	let t0;
    	let header;
    	let t1;
    	let content;
    	let t2;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	content = new Content({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			meta0 = element("meta");
    			meta1 = element("meta");
    			link = element("link");
    			script0 = element("script");
    			script1 = element("script");
    			script2 = element("script");
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(content.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(meta0, "charset", "utf-8");
    			add_location(meta0, file, 7, 2, 185);
    			attr_dev(meta1, "name", "viewport");
    			attr_dev(meta1, "content", "width=device-width, initial-scale=1, shrink-to-fit=no");
    			add_location(meta1, file, 8, 2, 212);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha2/css/bootstrap.min.css");
    			attr_dev(link, "integrity", "sha384-DhY6onE6f3zzKbjUPRc2hOzGAdEf4/Dz+WJwBvEYL/lkkIsI3ihufq9hk9K4lVoK");
    			attr_dev(link, "crossorigin", "anonymous");
    			add_location(link, file, 12, 2, 313);
    			if (script0.src !== (script0_src_value = "https://code.jquery.com/jquery-3.2.1.slim.min.js")) attr_dev(script0, "src", script0_src_value);
    			attr_dev(script0, "integrity", "sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN");
    			attr_dev(script0, "crossorigin", "anonymous");
    			add_location(script0, file, 18, 2, 554);
    			if (script1.src !== (script1_src_value = "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js")) attr_dev(script1, "src", script1_src_value);
    			attr_dev(script1, "integrity", "sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q");
    			attr_dev(script1, "crossorigin", "anonymous");
    			add_location(script1, file, 22, 2, 749);
    			if (script2.src !== (script2_src_value = "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js")) attr_dev(script2, "src", script2_src_value);
    			attr_dev(script2, "integrity", "sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl");
    			attr_dev(script2, "crossorigin", "anonymous");
    			add_location(script2, file, 26, 2, 969);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, meta0);
    			append_dev(document.head, meta1);
    			append_dev(document.head, link);
    			append_dev(document.head, script0);
    			append_dev(document.head, script1);
    			append_dev(document.head, script2);
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(content, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(meta0);
    			detach_dev(meta1);
    			detach_dev(link);
    			detach_dev(script0);
    			detach_dev(script1);
    			detach_dev(script2);
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(content, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, Content, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
